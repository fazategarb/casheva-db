import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const url =
      configService.get<string>('CLOUDINARY_URL') || process.env.CLOUDINARY_URL;
    if (url) {
      cloudinary.config({
        cloudinary_url: url,
      });
    }
    return cloudinary;
  },
};
