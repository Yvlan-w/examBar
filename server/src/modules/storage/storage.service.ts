import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Storage, S3Config } from 'coze-coding-dev-sdk';
import { URL } from 'url';
import * as http from 'http';
import * as https from 'https';
import { exec } from 'child_process';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

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
   * 上传题目图片到指定路径（如 questions/s3/xxx）
   * @param fileBuffer 文件 Buffer
   * @param uploadKey 上传路径（如 questions/s3/s3_q163/img0.jpeg）
   * @param contentType 内容类型
   * @returns 上传后的 URL 和 key
   */
  async uploadQuestionImage(fileBuffer: Buffer, uploadKey: string, contentType: string = 'image/png'): Promise<{ url: string; key: string }> {
    try {
      console.log(`[Storage] 上传题目图片: ${uploadKey}`);
      
      const uploadResult = await this.storage.uploadFile({
        fileContent: fileBuffer,
        fileName: uploadKey,
        contentType,
      });
      console.log('[Storage] 上传结果:', uploadResult);
      
      const actualKey = typeof uploadResult === 'string' ? uploadResult : uploadKey;
      
      // 生成长期有效的预签名 URL（365天）
      const presignedUrl = await this.storage.generatePresignedUrl({
        key: actualKey,
        expireTime: 60 * 60 * 24 * 365,
      });
      console.log(`[Storage] 生成 URL 成功: ${presignedUrl.substring(0, 80)}...`);
      
      return { url: presignedUrl, key: actualKey };
    } catch (error) {
      console.error('[Storage] 上传题目图片失败:', error);
      throw new Error('题目图片上传失败');
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
  async downloadFile(url: string): Promise<Buffer> {
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
   * 解析 .docx 文件为纯文本（快速处理）
   * @param buffer .docx 文件的 Buffer
   * @returns 解析后的文本内容
   */
  async parseDocxToText(buffer: Buffer): Promise<string> {
    try {
      console.log(`[DOCX处理] 开始解析 .docx 文件，大小: ${buffer.length} bytes`);
      
      let mammoth: any;
      try {
        mammoth = await import('mammoth');
      } catch (importError) {
        console.error('[DOCX处理] mammoth 库未安装:', importError.message);
        throw new Error('DOCX 解析需要 mammoth 库，请运行: pnpm add mammoth');
      }
      
      const result = await mammoth.extractRawText({ buffer });
      
      console.log(`[DOCX处理] 解析完成，文本长度: ${result.value.length} chars`);
      
      if (result.messages && result.messages.length > 0) {
        console.log('[DOCX处理] 解析警告:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      console.error('[DOCX处理] 解析失败:', error);
      throw new Error(`DOCX 解析失败: ${error.message || error}`);
    }
  }

  /**
   * 解析 .doc 文件为纯文本（快速处理，使用 word-extractor）
   * @param buffer .doc 文件的 Buffer
   * @returns 解析后的文本内容
   */
  async parseDocToText(buffer: Buffer): Promise<string> {
    try {
      console.log(`[DOC处理] 开始解析 .doc 文件，大小: ${buffer.length} bytes`);
      
      let WordExtractor: any;
      try {
        WordExtractor = await import('word-extractor');
      } catch (importError) {
        console.error('[DOC处理] word-extractor 库未安装:', importError.message);
        throw new Error('DOC 解析需要 word-extractor 库，请运行: pnpm add word-extractor');
      }
      
      const extractor = new WordExtractor();
      const doc = await extractor.extract(buffer);
      
      // extract() 返回 Document 对象，需要调用 getBody() 获取文本
      const text = doc.getBody();
      
      console.log(`[DOC处理] 解析完成，文本长度: ${text.length} chars`);
      
      return text;
    } catch (error) {
      console.error('[DOC处理] 解析失败:', error);
      throw new Error(`DOC 解析失败: ${error.message || error}`);
    }
  }

  /**
   * 将 .doc 文件转换为 PDF（备选方案，需要系统安装 LibreOffice）
   * @param docUrl .doc 文件的预签名 URL
   * @returns PDF 文件的 URL 和临时文件 key
   */
  async convertDocToPdf(docUrl: string): Promise<{ pdfUrl: string; pdfKey: string }> {
    const tempDir = join(tmpdir(), `doc_convert_${randomUUID()}`);
    
    try {
      console.log(`[DOC处理] 开始下载 DOC 文件: ${docUrl.substring(0, 100)}...`);
      
      // 1. 创建临时目录
      await mkdir(tempDir, { recursive: true });
      
      // 2. 下载 DOC 文件
      const docPath = join(tempDir, 'input.doc');
      const docBuffer = await this.downloadFile(docUrl);
      await writeFile(docPath, docBuffer);
      console.log(`[DOC处理] DOC 已下载，大小: ${docBuffer.length} bytes`);
      
      // 3. 使用 LibreOffice 转换为 PDF
      console.log('[DOC处理] 开始转换 DOC 为 PDF...');
      
      await this.executeCommand(`soffice --headless --convert-to pdf "${docPath}" --outdir "${tempDir}"`);
      
      // 4. 查找生成的 PDF 文件
      const { readdir } = require('fs/promises');
      const files = await readdir(tempDir);
      const pdfFile = files.find(f => f.endsWith('.pdf'));
      
      if (!pdfFile) {
        throw new Error('DOC 转 PDF 失败，未生成 PDF 文件');
      }
      
      const pdfPath = join(tempDir, pdfFile);
      console.log(`[DOC处理] PDF 已生成: ${pdfFile}`);
      
      // 5. 上传 PDF 到 TOS
      const { readFile } = require('fs/promises');
      const pdfBuffer = await readFile(pdfPath);
      const uploadResult = await this.uploadTempFile(pdfBuffer, `converted_${Date.now()}.pdf`, 'application/pdf');
      
      console.log(`[DOC处理] PDF 已上传: ${uploadResult.key}`);
      
      // 6. 清理临时文件
      await rm(tempDir, { recursive: true, force: true });
      console.log('[DOC处理] 临时文件已清理');
      
      return { pdfUrl: uploadResult.url, pdfKey: uploadResult.key };
    } catch (error) {
      // 确保清理临时目录
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('[DOC处理] 清理临时文件失败:', cleanupError);
      }
      
      console.error('[DOC处理] 转换失败:', error);
      throw new Error(`DOC 转 PDF 失败: ${error.message || error}。请确保系统已安装 LibreOffice。`);
    }
  }

  /**
   * 执行系统命令
   */
  private async executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
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