import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3100',
  'http://localhost:3111',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
  });

  // ─── Security ─────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(compression());

  // ─── CORS ─────────────────────────────────────────
  // Static allow-list from env + sensible defaults
  const configuredOrigins = [process.env.ALLOWED_ORIGINS, process.env.APP_URL]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]));

  const isDev = process.env.NODE_ENV !== 'production';
  // Dev convenience: allow any LAN/private IP origin so mobile testing "just works".
  // RFC1918 ranges: 10.x, 172.16-31.x, 192.168.x
  const LAN_ORIGIN_RE =
    /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d+)?$/i;

  const corsLogger = new Logger('CORS');
  corsLogger.log(`Allowed origins: ${allowedOrigins.join(', ') || '(none)'}`);
  if (isDev) corsLogger.log('Dev mode: LAN/private IP origins are auto-allowed');

  app.enableCors({
    origin: (origin, callback) => {
      // Allow no-origin requests (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (isDev && LAN_ORIGIN_RE.test(origin)) return callback(null, true);
      corsLogger.warn(`Blocked: ${origin}`);
      // Return false (not Error) so CORS headers are simply omitted instead of 500-ing
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
  });

  // ─── Global prefix ────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Validation ───────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global filters & interceptors ────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ─── Lifecycle ────────────────────────────────────
  app.enableShutdownHooks();

  // ─── Swagger ──────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Rentage API')
    .setDescription('Rental marketplace API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('rentage_refresh')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 4000;
  // Bind to 0.0.0.0 so the API is reachable from LAN devices (mobile testing)
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 API running on http://localhost:${port}`);
  logger.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});

