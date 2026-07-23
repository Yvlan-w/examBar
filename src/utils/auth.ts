import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useUserStore } from '@/store/user'

export const STORAGE_KEY_USER = 'examBar_user'
export const STORAGE_KEY_USER_ID = 'examBar_userId'

export interface LoginResult {
  success: boolean
  user?: UserData
  message?: string
}

export interface UserData {
  id: number
  openid: string
  nickName?: string
  avatarUrl?: string
}

export const getUserInfo = (): UserData | null => {
  try {
    const userStr = Taro.getStorageSync(STORAGE_KEY_USER)
    if (userStr) {
      return JSON.parse(userStr) as UserData
    }
  } catch (e) {
    console.error('getUserInfo error:', e)
  }
  return null
}

export const saveUserInfo = (user: UserData): void => {
  try {
    Taro.setStorageSync(STORAGE_KEY_USER, JSON.stringify(user))
    Taro.setStorageSync(STORAGE_KEY_USER_ID, user.id.toString())
  } catch (e) {
    console.error('saveUserInfo error:', e)
  }
}

export const clearUserInfo = (): void => {
  try {
    Taro.removeStorageSync(STORAGE_KEY_USER)
    Taro.removeStorageSync(STORAGE_KEY_USER_ID)
  } catch (e) {
    console.error('clearUserInfo error:', e)
  }
}

export const getUserId = (): number | null => {
  try {
    const userId = Taro.getStorageSync(STORAGE_KEY_USER_ID)
    if (userId) {
      return parseInt(userId)
    }
  } catch (e) {
    console.error('getUserId error:', e)
  }
  return null
}

export const getUserProfile = async (): Promise<{ nickName?: string; avatarUrl?: string } | null> => {
  try {
    console.log('Getting user profile...')
    const res = await Taro.getUserProfile({
      desc: '用于完善会员资料',
    })
    console.log('getUserProfile result:', res)
    return {
      nickName: res.userInfo?.nickName,
      avatarUrl: res.userInfo?.avatarUrl,
    }
  } catch (e: any) {
    console.warn('getUserProfile failed:', e?.message || e)
    return null
  }
}

export const updateUserProfile = async (userId: number, nickName: string, avatarUrl: string): Promise<boolean> => {
  try {
    const result = await Network.request({
      url: '/api/users/profile',
      method: 'PUT',
      data: {
        id: userId,
        nickName,
        avatarUrl,
      },
    })
    return result.data?.success === true
  } catch (e) {
    console.error('updateUserProfile error:', e)
    return false
  }
}

export const loginWithWechat = async (): Promise<LoginResult> => {
  try {
    console.log('Starting wechat login...')
    
    const loginRes = await Taro.login()
    console.log('Taro.login result:', loginRes)
    
    if (!loginRes.code) {
      console.error('Failed to get login code')
      return { success: false, message: '获取登录凭证失败' }
    }

    console.log('Got code, calling backend...')
    
    const result = await Network.request({
      url: '/api/auth/login',
      method: 'POST',
      data: { code: loginRes.code },
    })
    
    console.log('Backend response:', result)
    
    const responseData = result.data
    
    if (responseData && responseData.success && responseData.data) {
      const user = responseData.data.user
      console.log('Login success, user:', user)
      
      saveUserInfo(user)
      useUserStore.getState().login(user)
      return { success: true, user }
    }

    console.error('Login failed, response:', responseData)
    return { success: false, message: responseData?.message || '登录失败' }
  } catch (error: any) {
    console.error('loginWithWechat error:', error)
    return { success: false, message: error?.message || '登录异常，请重试' }
  }
}

export const loginWithWechatH5 = async (): Promise<LoginResult> => {
  try {
    console.log('Starting H5 login...')
    
    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
    
    if (isWeapp) {
      return await loginWithWechat()
    }
    
    let nickName = ''
    let avatarUrl = ''
    
    try {
      const res = await Taro.getUserProfile({
        desc: '用于登录并获取您的基本信息',
      })
      nickName = res.userInfo?.nickName || ''
      avatarUrl = res.userInfo?.avatarUrl || ''
    } catch (e) {
      console.warn('getUserProfile failed, using anonymous login')
    }

    const openid = 'h5_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)

    const result = await Network.request({
      url: '/api/auth/login-h5',
      method: 'POST',
      data: {
        openid,
        nickName,
        avatarUrl,
      },
    })
    
    console.log('H5 login response:', result)
    
    const responseData = result.data
    
    if (responseData && responseData.success && responseData.data) {
      const user = responseData.data
      console.log('H5 login success, user:', user)
      saveUserInfo(user)
      useUserStore.getState().login(user)
      return { success: true, user }
    }

    return { success: false, message: responseData?.message || '登录失败' }
  } catch (error: any) {
    console.error('loginWithWechatH5 error:', error)
    return { success: false, message: error?.message || '登录异常，请重试' }
  }
}

export const requireLogin = async (callback?: () => void): Promise<boolean> => {
  const user = getUserInfo()
  if (user) {
    console.log('Already logged in:', user)
    useUserStore.getState().login(user)
    if (callback) callback()
    return true
  }

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  console.log('Not logged in, env:', isWeapp ? 'weapp' : 'h5')

  try {
    let result: LoginResult
    if (isWeapp) {
      result = await loginWithWechat()
    } else {
      result = await loginWithWechatH5()
    }

    if (result.success) {
      console.log('Login successful')
      if (callback) callback()
    } else {
      console.error('Login failed:', result.message)
      Taro.showToast({
        title: result.message || '登录失败，请重试',
        icon: 'none',
      })
    }
    return result.success
  } catch (error) {
    console.error('requireLogin error:', error)
    Taro.showToast({
      title: '登录失败，请重试',
      icon: 'none',
    })
    return false
  }
}

export const loginWithProfile = async (profile?: { nickName?: string; avatarUrl?: string }): Promise<LoginResult> => {
  try {
    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
    console.log('loginWithProfile env:', isWeapp ? 'weapp' : 'h5')
    
    let loginCode = 'h5_login'
    
    if (isWeapp) {
      const loginRes = await Taro.login()
      console.log('Taro.login result:', loginRes)
      if (loginRes.code) {
        loginCode = loginRes.code
      }
    }

    const result = await Network.request({
      url: '/api/auth/login',
      method: 'POST',
      data: { code: loginCode },
    })

    const responseData = result.data
    
    if (responseData && responseData.success && responseData.data) {
      let user = responseData.data.user
      
      if (profile && (profile.nickName || profile.avatarUrl)) {
        const updateSuccess = await updateUserProfile(user.id, profile.nickName || '', profile.avatarUrl || '')
        if (updateSuccess) {
          user = { ...user, ...profile }
        }
      }
      
      saveUserInfo(user)
      useUserStore.getState().login(user)
      return { success: true, user }
    }

    return { success: false, message: responseData?.message || '登录失败' }
  } catch (error: any) {
    console.error('loginWithProfile error:', error)
    return { success: false, message: error?.message || '登录异常，请重试' }
  }
}