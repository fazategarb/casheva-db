import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Application is running on: http://localhost:3000`);
  console.log(`
    📚 Swagger OpenAPI Docs available on: http://localhost:3000/api/docs`);
}
void bootstrap();
