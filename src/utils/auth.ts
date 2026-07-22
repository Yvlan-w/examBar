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

export const loginWithWechat = async (): Promise<LoginResult> => {
  try {
    const loginRes = await Taro.login({
      success: (res) => {
        console.log('login success:', res)
      },
      fail: (err) => {
        console.error('login fail:', err)
      },
    })

    if (!loginRes.code) {
      return { success: false, message: '获取登录凭证失败' }
    }

    const result = await Network.request({
      url: '/api/auth/login',
      method: 'POST',
      data: { code: loginRes.code },
    })

    if (result?.data?.success && result.data.data) {
      const user = result.data.data.user
      saveUserInfo(user)
      useUserStore.getState().login(user)
      return { success: true, user }
    }

    return { success: false, message: '登录失败' }
  } catch (error) {
    console.error('loginWithWechat error:', error)
    return { success: false, message: '登录异常，请重试' }
  }
}

export const loginWithWechatH5 = async (): Promise<LoginResult> => {
  try {
    const res = await Taro.getUserProfile({
      desc: '用于登录并获取您的基本信息',
    })

    const openid = 'h5_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)

    const result = await Network.request({
      url: '/api/auth/login-h5',
      method: 'POST',
      data: {
        openid,
        nickName: res.userInfo?.nickName,
        avatarUrl: res.userInfo?.avatarUrl,
      },
    })

    if (result?.data?.success && result.data.data) {
      const user = result.data.data
      saveUserInfo(user)
      useUserStore.getState().login(user)
      return { success: true, user }
    }

    return { success: false, message: '登录失败' }
  } catch (error) {
    console.error('loginWithWechatH5 error:', error)
    return { success: false, message: '登录异常，请重试' }
  }
}

export const requireLogin = async (callback?: () => void): Promise<boolean> => {
  const user = getUserInfo()
  if (user) {
    useUserStore.getState().login(user)
    if (callback) callback()
    return true
  }

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  try {
    let result: LoginResult
    if (isWeapp) {
      result = await loginWithWechat()
    } else {
      result = await loginWithWechatH5()
    }

    if (result.success && callback) {
      callback()
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