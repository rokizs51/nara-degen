import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: '*', methods: 'GET,OPTIONS', allowedHeaders: 'Content-Type' })
  const port = process.env.PORT ? parseInt(process.env.PORT) : 4000
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`market-data-service listening on ${port}`)
}

bootstrap()
