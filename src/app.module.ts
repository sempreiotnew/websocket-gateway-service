import { Module } from '@nestjs/common';

import { SocketModule } from './socket/socket.module';
import { NatsModule } from './nats/nats.module';

@Module({
  imports: [SocketModule, NatsModule],
})
export class AppModule {}
