import { PropsWithChildren, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { LucideTaroProvider } from 'lucide-react-taro';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { Preset } from './presets';

const App = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    // 微信小程序隐私协议授权监听
    // 参考文档: https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/product/privacy_setting.html
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      // @ts-ignore
      if (typeof wx !== 'undefined' && wx.onNeedPrivacyAuthorization) {
        // @ts-ignore
        wx.onNeedPrivacyAuthorization((resolve: any) => {
          console.log('[Privacy] onNeedPrivacyAuthorization triggered');
          // 调用 requirePrivacyAuthorize 弹出隐私协议弹窗
          // @ts-ignore
          if (wx.requirePrivacyAuthorize) {
            // @ts-ignore
            wx.requirePrivacyAuthorize({
              success: () => {
                console.log('[Privacy] requirePrivacyAuthorize success');
                resolve?.({ buttonId: 'agree-btn', event: 'agree' });
              },
              fail: (err: any) => {
                console.warn('[Privacy] requirePrivacyAuthorize fail:', err);
                resolve?.({ buttonId: 'disagree-btn', event: 'disagree' });
              },
            });
          } else {
            // 降级处理：使用 showModal
            Taro.showModal({
              title: '隐私协议授权',
              content: '使用本小程序需要您同意《用户隐私保护指引》',
              confirmText: '同意',
              cancelText: '拒绝',
              success: (res) => {
                if (res.confirm) {
                  resolve?.({ buttonId: 'agree-btn', event: 'agree' });
                } else {
                  resolve?.({ buttonId: 'disagree-btn', event: 'disagree' });
                }
              },
              fail: () => {
                resolve?.({ buttonId: 'disagree-btn', event: 'disagree' });
              },
            });
          }
        });
      }
    }
  }, []);

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
