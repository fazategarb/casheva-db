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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger OpenAPI Docs available on: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
