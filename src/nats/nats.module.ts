import { Module } from '@nestjs/common';
import { NatsService } from './nats.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      // envFilePath: process.env.NODE_ENV === 'production' ? '.env' : '.env.dev',
    }),
  ],
  providers: [NatsService],
  exports: [NatsService],
})
export class NatsModule {}
