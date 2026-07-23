import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Storage, S3Config } from 'coze-coding-dev-sdk';

@Injectable()
export class StorageService implements OnModuleInit {
  private storage: S3Storage;

  async onModuleInit() {
    await this.initStorage();
  }

  private async initStorage() {
    try {
      const config = new S3Config();
      this.storage = new S3Storage(config);
      console.log('Storage client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage client:', error);
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, contentType: string = 'image/png'): Promise<string> {
    try {
      const key = `avatars/${Date.now()}_${fileName}`;
      
      const url = await this.storage.uploadFile({
        fileContent: fileBuffer,
        fileName: key,
        contentType,
      });
      console.log('Upload result URL:', url);
      return url;
    } catch (error) {
      console.error('Upload file error:', error);
      throw new Error('文件上传失败');
    }
  }

  async generatePresignedUrl(key: string, expireTime: number = 1800): Promise<string> {
    try {
      const url = await this.storage.generatePresignedUrl({
        key,
        expireTime,
      });
      return url;
    } catch (error) {
      console.error('Generate presigned URL error:', error);
      throw new Error('生成签名URL失败');
    }
  }

  async uploadFromUrl(url: string): Promise<string> {
    try {
      const result = await this.storage.uploadFromUrl({
        url,
      });
      console.log('uploadFromUrl result:', result);
      return result;
    } catch (error) {
      console.error('Upload from URL error:', error);
      throw new Error('从URL上传文件失败');
    }
  }
}