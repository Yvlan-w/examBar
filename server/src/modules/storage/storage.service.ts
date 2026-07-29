import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Storage, S3Config } from 'coze-coding-dev-sdk';
import { exec } from 'child_process';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
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
   * 将 PDF 文件转换为图片
   * @param pdfUrl PDF 文件的 URL
   * @returns 图片 URL 列表和临时文件 keys
   */
  async convertPdfToImages(pdfUrl: string): Promise<{ imageUrls: string[]; tempFileKeys: string[] }> {
    const tempDir = join(tmpdir(), `pdf_convert_${randomUUID()}`);
    
    try {
      console.log(`[PDF处理] 开始下载 PDF: ${pdfUrl}`);
      
      // 1. 创建临时目录
      await mkdir(tempDir, { recursive: true });
      
      // 2. 下载 PDF 文件
      const pdfPath = join(tempDir, 'input.pdf');
      const pdfBuffer = await this.downloadFile(pdfUrl);
      await writeFile(pdfPath, pdfBuffer);
      console.log(`[PDF处理] PDF 已下载，大小: ${pdfBuffer.length} bytes`);
      
      // 3. 使用 pdftoppm 将 PDF 转为图片
      console.log('[PDF处理] 开始转换 PDF 为图片...');
      const outputPrefix = join(tempDir, 'page');
      
      try {
        await this.executeCommand(`pdftoppm -png -r 150 "${pdfPath}" "${outputPrefix}"`);
      } catch (convertError) {
        console.error('[PDF处理] pdftoppm 转换失败，尝试使用 ghostscript...', convertError);
        // 备选方案：使用 ghostscript
        try {
          await this.executeCommand(`gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r150 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile="${outputPrefix}_%03d.png" "${pdfPath}"`);
        } catch (gsError) {
          console.error('[PDF处理] ghostscript 也失败:', gsError);
          throw new Error('PDF 转换失败，系统未安装 pdftoppm 或 ghostscript');
        }
      }
      
      // 4. 查找生成的图片文件
      const { readdir } = require('fs/promises');
      const files = await readdir(tempDir);
      const imageFiles = files.filter(f => f.startsWith('page') && f.endsWith('.png')).sort();
      
      console.log(`[PDF处理] 生成 ${imageFiles.length} 张图片`);
      
      if (imageFiles.length === 0) {
        throw new Error('PDF 转换失败，未生成图片');
      }
      
      // 5. 上传图片到 TOS
      const imageUrls: string[] = [];
      const tempFileKeys: string[] = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const imagePath = join(tempDir, imageFiles[i]);
        const imageBuffer = await readFile(imagePath);
        const imageName = `pdf_page_${Date.now()}_${i}.png`;
        
        const uploadResult = await this.uploadTempFile(imageBuffer, imageName, 'image/png');
        imageUrls.push(uploadResult.url);
        tempFileKeys.push(uploadResult.key);
        
        console.log(`[PDF处理] 第 ${i + 1} 页已上传: ${uploadResult.key}`);
      }
      
      // 6. 清理临时文件
      await rm(tempDir, { recursive: true, force: true });
      console.log('[PDF处理] 临时文件已清理');
      
      return { imageUrls, tempFileKeys };
    } catch (error) {
      // 确保清理临时目录
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('[PDF处理] 清理临时文件失败:', cleanupError);
      }
      
      console.error('[PDF处理] 转换失败:', error);
      throw error;
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

  /**
   * 执行系统命令
   */
  private async executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`[命令执行失败] ${command}`);
          console.error(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
          reject(error);
        } else {
          if (stderr) {
            console.log(`[命令输出] stderr: ${stderr}`);
          }
          resolve();
        }
      });
    });
  }
}