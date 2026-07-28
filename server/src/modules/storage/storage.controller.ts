import { Controller, Post, UploadedFile, UseInterceptors, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: any) {
    try {
      const url = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      return { code: 200, msg: 'success', data: { url } };
    } catch (error) {
      console.error('Upload error:', error);
      return { code: 500, msg: '上传失败', data: null };
    }
  }

  @Post('upload-temp')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTemp(@UploadedFile() file: any) {
    try {
      const { url, key } = await this.storageService.uploadTempFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      return { code: 200, msg: 'success', data: { url, key } };
    } catch (error) {
      console.error('Upload temp error:', error);
      return { code: 500, msg: '上传失败', data: null };
    }
  }

  @Post('delete')
  @HttpCode(200)
  async delete({ body }: { body: { key: string } }) {
    await this.storageService.deleteFile(body.key);
    return { code: 200, msg: 'success', data: null };
  }
}