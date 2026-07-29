import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Storage, S3Config } from 'coze-coding-dev-sdk';
import { URL } from 'url';
import * as http from 'http';
import * as https from 'https';

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
      
      const uploadResult = await this.storage.uploadFile({
        fileContent: fileBuffer,
        fileName: key,
        contentType,
      });
      console.log('Upload result:', uploadResult);
      
      const actualKey = typeof uploadResult === 'string' ? uploadResult : key;
      console.log('Actual key for generating URL:', actualKey);
      
      const presignedUrl = await this.storage.generatePresignedUrl({
        key: actualKey,
        expireTime: 60 * 60 * 24 * 365,
      });
      console.log('Generated presigned URL:', presignedUrl);
      return presignedUrl;
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
      const uploadResult = await this.storage.uploadFromUrl({
        url,
      });
      console.log('uploadFromUrl result:', uploadResult);
      
      if (typeof uploadResult !== 'string') {
        throw new Error('Upload from URL failed: no key returned');
      }
      
      const presignedUrl = await this.storage.generatePresignedUrl({
        key: uploadResult,
        expireTime: 60 * 60 * 24 * 365,
      });
      console.log('Generated presigned URL:', presignedUrl);
      return presignedUrl;
    } catch (error) {
      console.error('Upload from URL error:', error);
      throw new Error('从URL上传文件失败');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.storage.deleteFile({ fileKey: key });
      console.log('File deleted successfully:', key);
    } catch (error) {
      console.error('Delete file error:', error);
    }
  }

  async uploadTempFile(fileBuffer: Buffer, fileName: string, contentType: string = 'image/png'): Promise<{ url: string; key: string }> {
    try {
      const key = `temp/${Date.now()}_${fileName}`;
      
      const uploadResult = await this.storage.uploadFile({
        fileContent: fileBuffer,
        fileName: key,
        contentType,
      });
      console.log('Upload result:', uploadResult);
      
      const actualKey = typeof uploadResult === 'string' ? uploadResult : key;
      
      const presignedUrl = await this.storage.generatePresignedUrl({
        key: actualKey,
        expireTime: 60 * 60 * 24,
      });
      console.log('Generated presigned URL:', presignedUrl);
      return { url: presignedUrl, key: actualKey };
    } catch (error) {
      console.error('Upload temp file error:', error);
      throw new Error('临时文件上传失败');
    }
  }

  /**
   * 将 PDF 文件逐页渲染为图片并上传到 TOS
   * 使用 pdfjs-dist + @napi-rs/canvas 纯 Node.js 实现，无需系统依赖
   * @param pdfUrl PDF 文件的预签名 URL
   * @returns 图片 URL 列表和临时文件 keys
   */
  async convertPdfToImages(pdfUrl: string): Promise<{ imageUrls: string[]; tempFileKeys: string[] }> {
    try {
      console.log(`[PDF处理] 开始下载 PDF: ${pdfUrl.substring(0, 100)}...`);

      // 1. 下载 PDF 文件到内存
      const pdfBuffer = await this.downloadFile(pdfUrl);
      console.log(`[PDF处理] PDF 已下载，大小: ${pdfBuffer.length} bytes`);

      // 2. 动态导入 pdfjs-dist legacy 版本（Node.js 环境）和 @napi-rs/canvas
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const { createCanvas } = await import('@napi-rs/canvas');

      // 禁用 worker（Node.js 环境不需要）
      const pdfDocument = await pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useSystemFonts: true,
        isEvalSupported: false,
      }).promise;

      const numPages = pdfDocument.numPages;
      console.log(`[PDF处理] PDF 共 ${numPages} 页`);

      const imageUrls: string[] = [];
      const tempFileKeys: string[] = [];

      // 3. 逐页渲染为图片
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x 缩放以保证清晰度

        // 创建 canvas 并渲染
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        await page.render({
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport,
        }).promise;

        // 导出为 PNG buffer
        const pngBuffer = canvas.toBuffer('image/png');
        const imageName = `pdf_page_${Date.now()}_${pageNum}.png`;

        // 4. 上传到 TOS
        const uploadResult = await this.uploadTempFile(pngBuffer, imageName, 'image/png');
        imageUrls.push(uploadResult.url);
        tempFileKeys.push(uploadResult.key);

        console.log(`[PDF处理] 第 ${pageNum}/${numPages} 页已上传: ${uploadResult.key}`);

        // 释放页面资源
        page.cleanup();
      }

      console.log(`[PDF处理] 转换完成，共 ${numPages} 张图片`);
      return { imageUrls, tempFileKeys };
    } catch (error) {
      console.error('[PDF处理] 转换失败:', error);
      throw new Error(`PDF 转换失败: ${error.message || error}`);
    }
  }

  /**
   * 下载文件
   */
  private async downloadFile(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      client.get(url, (response: http.IncomingMessage) => {
        const chunks: Buffer[] = [];
        
        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        
        response.on('error', reject);
      }).on('error', reject);
    });
  }

}