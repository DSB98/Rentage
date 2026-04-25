import {
  Controller, Post, Delete, Param,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadImage(file);
  }

  @Delete('image/:publicId')
  @ApiOperation({ summary: 'Delete an uploaded image' })
  async deleteImage(@Param('publicId') publicId: string) {
    await this.uploadService.deleteImage(publicId);
    return { message: 'Image deleted' };
  }
}
