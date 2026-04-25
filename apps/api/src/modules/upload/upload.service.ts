import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'rentage',
  ): Promise<{ url: string; publicId: string }> {
    if (!file) throw new BadRequestException('No file provided');

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) throw new BadRequestException('File too large (max 5MB)');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            transformation: [
              { width: 1200, height: 900, crop: 'limit' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error || !result) return reject(new BadRequestException('Upload failed'));
            resolve({ url: result.secure_url, publicId: result.public_id });
          },
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
