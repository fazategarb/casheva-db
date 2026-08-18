import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // ==========================================
  // KONFIGURASI CORS
  // ==========================================
  app.enableCors({
    origin: true, // Mengizinkan semua origin untuk kebutuhan dev (misal: frontend Vite http://localhost:5173)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ==========================================
  // KONFIGURASI SWAGGER (OPENAPI)
  // ==========================================
  const config = new DocumentBuilder()
    .setTitle('API Koperasi Simpan Pinjam TNI AD')
    .setDescription(
      'Dokumentasi REST API Sistem Informasi Koperasi Simpan Pinjam (Lomba RTI 2026). ' +
        'Mendukung fitur Multi-Tenant/Session Kotama & Satminkal, Simpanan, Pinjaman, dan SHU.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Masukkan Token JWT hasil dari Login',
        in: 'header',
      },
      'JWT-auth', // Key nama auth yang dipasang di controller
    )
    .build();

  const customCss = `
    /* Ubah warna & styling tombol Authorize utama saat terautentikasi */
    .swagger-ui .btn.authorize.locked {
      background-color: #10B981 !important;
      border-color: #10B981 !important;
      color: #FFFFFF !important;
      font-weight: bold !important;
    }
    .swagger-ui .btn.authorize.locked svg {
      fill: #FFFFFF !important;
    }

    /* Ubah ikon gembok pada setiap endpoint saat terautentikasi menjadi gembok TERBUKA (UNLOCK) */
    .swagger-ui .authorization__btn.locked svg {
      fill: #10B981 !important;
      filter: drop-shadow(0px 0px 3px rgba(16, 185, 129, 0.5));
    }
    
    /* Ganti path SVG gembok tertutup menjadi SVG gembok TERBUKA (Unlocked Padlock) */
    .swagger-ui .authorization__btn.locked svg path {
      d: path("M9 11V7a5 5 0 0110 0v4m-3 0h-4a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2v-7a2 2 0 00-2-2h-4z") !important;
    }

    .swagger-ui .authorization__btn.locked {
      opacity: 1 !important;
    }
  `;

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss,
    customSiteTitle: 'Casheva Koperasi - API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger OpenAPI Docs available on: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
