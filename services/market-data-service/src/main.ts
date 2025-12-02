import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enhanced CORS configuration
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    frontendUrl,
    'https://your-vercel-domain.vercel.app',
    'https://your-custom-domain.com'
  ];

  console.log('CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 hours
  })

  const port = process.env.PORT ? parseInt(process.env.PORT) : 4000
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`market-data-service listening on ${port}`)
}

bootstrap()
