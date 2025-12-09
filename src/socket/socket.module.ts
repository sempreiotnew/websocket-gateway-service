import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  imports: [NatsModule],
  providers: [SocketGateway],
})
export class SocketModule {}
