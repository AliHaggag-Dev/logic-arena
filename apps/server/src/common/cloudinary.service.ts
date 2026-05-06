import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

/** Max avatar dimension after Cloudinary transformation */
const AVATAR_SIZE = 256;

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Uploads an avatar image buffer directly to Cloudinary via `upload_stream`.
   * - Stores under `logic-arena/avatars/{userId}` so each user has exactly one avatar.
   * - Applies face-aware cropping + auto quality/format transforms on Cloudinary's edge.
   * - Returns the HTTPS `secure_url` of the optimised image.
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'logic-arena/avatars',
          public_id: userId,
          overwrite: true,
          invalidate: true, // Busts Cloudinary CDN cache
          resource_type: 'image',
          transformation: [
            { width: AVATAR_SIZE, height: AVATAR_SIZE, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error: unknown, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed', error);
            reject(new InternalServerErrorException('Avatar upload failed'));
          } else {
            // Append the version timestamp to bust the browser's local cache
            resolve(`${result.secure_url}?v=${result.version}`);
          }
        },
      );
      stream.end(buffer);
    });
  }
}
