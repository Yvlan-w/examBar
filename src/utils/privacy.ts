/**
 * 微信小程序隐私协议工具模块
 * 
 * 参考文档: https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/product/privacy_setting.html
 * 
 * 涉及隐私的 API:
 * - wx.login: 登录 (不需要隐私声明，但建议在登录前检查)
 * - wx.getUserProfile: 获取用户信息
 * - wx.chooseImage: 选择图片 (需要 Album 权限)
 * - wx.chooseMedia: 选择媒体 (需要 Album/Photo 权限)
 * - wx.uploadFile: 上传文件
 * - wx.downloadFile: 下载文件
 * 
 * privacy_key 列表:
 * - UserInfo: 用户信息
 * - Album: 相册
 * - Photo: 相机
 * - Location: 位置信息
 */

import Taro from '@tarojs/taro'

const isWeapp = () => Taro.getEnv() === Taro.ENV_TYPE.WEAPP

/**
 * 获取隐私协议状态
 * @returns {Promise<{needAuthorization: boolean, eventName?: string}>}
 */
export const getPrivacySetting = (): Promise<{ needAuthorization: boolean; eventName?: string }> => {
  return new Promise((resolve) => {
    if (!isWeapp()) {
      resolve({ needAuthorization: false })
      return
    }

    // @ts-ignore
    if (typeof wx === 'undefined' || !wx.getPrivacySetting) {
      resolve({ needAuthorization: false })
      return
    }

    // @ts-ignore
    wx.getPrivacySetting({
      success(res: any) {
        console.log('[Privacy] getPrivacySetting success:', res)
        // needAuthorization: true 表示需要用户授权
        resolve({
          needAuthorization: res.needAuthorization === true,
          eventName: res.eventName,
        })
      },
      fail(err: any) {
        console.warn('[Privacy] getPrivacySetting fail:', err)
        // 接口不存在或失败时，默认需要授权以确保合规
        resolve({ needAuthorization: true })
      },
    })
  })
}

/**
 * 打开隐私协议授权页面
 * @returns {Promise<boolean>} 用户是否同意
 */
export const openPrivacyContract = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!isWeapp()) {
      resolve(true)
      return
    }

    // @ts-ignore
    if (typeof wx === 'undefined' || !wx.openPrivacyContract) {
      resolve(true)
      return
    }

    // @ts-ignore
    wx.openPrivacyContract({
      success() {
        console.log('[Privacy] openPrivacyContract success - user agreed')
        resolve(true)
      },
      fail(err: any) {
        console.warn('[Privacy] openPrivacyContract fail:', err)
        // 用户拒绝或关闭
        resolve(false)
      },
      complete() {
        // 无论成功失败都触发
      },
    })
  })
}

/**
 * 隐私协议前置检查
 * 在调用涉及隐私的 API 前调用
 * 
 * @param {Function} action - 需要执行的操作
 * @param {string} [featureName='此功能'] - 功能名称，用于提示
 * @returns {Promise<boolean>} 是否可以继续执行
 */
export const checkPrivacyBeforeAction = async (
  action: () => void | Promise<void>,
  featureName: string = '此功能'
): Promise<boolean> => {
  if (!isWeapp()) {
    await action()
    return true
  }

  try {
    const { needAuthorization } = await getPrivacySetting()
    
    if (!needAuthorization) {
      await action()
      return true
    }

    // 需要用户授权 - 使用 showModal 并等待结果
    const modalResult = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: '隐私协议授权',
        content: `使用${featureName}需要您同意《用户隐私保护指引》，是否前往查看并同意？`,
        confirmText: '同意',
        cancelText: '拒绝',
        success: (res) => {
          resolve(res.confirm)
        },
        fail: () => {
          resolve(false)
        },
      })
    })

    if (!modalResult) {
      Taro.showToast({
        title: '您已拒绝授权',
        icon: 'none',
      })
      return false
    }

    // 用户同意，打开隐私协议页面
    const agreed = await openPrivacyContract()
    if (agreed) {
      await action()
      return true
    } else {
      Taro.showToast({
        title: '您已拒绝授权',
        icon: 'none',
      })
      return false
    }
  } catch (err) {
    console.error('[Privacy] checkPrivacyBeforeAction error:', err)
    // 出错时默认允许操作，避免阻塞用户
    await action()
    return true
  }
}

/**
 * 带隐私检查的 chooseImage 封装
 * @param {Object} options - Taro.chooseImage 参数
 */
export const chooseImageWithPrivacy = async (
  options: Taro.chooseImage.Option
): Promise<Taro.chooseImage.SuccessCallbackResult> => {
  if (!isWeapp()) {
    return Taro.chooseImage(options)
  }

  const { needAuthorization } = await getPrivacySetting()
  
  if (needAuthorization) {
    const agreed = await openPrivacyContract()
    if (!agreed) {
      throw new Error('用户拒绝了隐私协议授权')
    }
  }

  return Taro.chooseImage(options)
}

/**
 * 带隐私检查的 getUserProfile 封装
 */
export const getUserProfileWithPrivacy = async (
  desc: string = '用于完善会员资料'
): Promise<{ nickName?: string; avatarUrl?: string } | null> => {
  if (!isWeapp()) {
    const res = await Taro.getUserProfile({ desc })
    return { nickName: res.userInfo?.nickName, avatarUrl: res.userInfo?.avatarUrl }
  }

  const { needAuthorization } = await getPrivacySetting()
  
  if (needAuthorization) {
    const agreed = await openPrivacyContract()
    if (!agreed) {
      return null
    }
  }

  try {
    const res = await Taro.getUserProfile({ desc })
    return { nickName: res.userInfo?.nickName, avatarUrl: res.userInfo?.avatarUrl }
  } catch (e) {
    console.warn('[Privacy] getUserProfile failed:', e)
    return null
  }
}

/**
 * 带隐私检查的 login 封装
 */
export const loginWithPrivacy = async (): Promise<Taro.login.SuccessCallbackResult> => {
  if (isWeapp()) {
    const { needAuthorization } = await getPrivacySetting()
    if (needAuthorization) {
      const agreed = await openPrivacyContract()
      if (!agreed) {
        throw new Error('用户拒绝了隐私协议授权')
      }
    }
  }

  return Taro.login()
}
