import { OnModuleInit } from '@nestjs/common';

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NatsService } from 'src/nats/nats.service';

@WebSocketGateway(3005, {
  cors: {
    origin: '*',
  },
})
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  constructor(private readonly natsService: NatsService) {}

  @WebSocketServer()
  server: Server;

  async onModuleInit() {
    await this.natsService.subscribeNATS('nats.>', (data) => {
      console.log(data);
      console.log(`📥 NATS subscribed nats.> ${data.userId}`);
      console.log(data);
    });
  }
  private async waitForNats() {
    while (!this.natsService['natsConnection']) {
      console.log('⏳ Waiting for NATS to connect...');
      await new Promise((res) => setTimeout(res, 100));
    }
  }
  async handleConnection(client: Socket) {
    const clientId = client.handshake.query.clientId as string;
    if (!clientId) {
      console.log(`Websocket ID not found ${clientId}`);
      client.disconnect();
      return;
    }

    console.log(`🔌 Client ${client.id} connected as user ${clientId}`);

    // Subscribe to personal topic
    const topic = `nats.user.${clientId}`;

    await this.natsService.subscribeNATS(topic, (data) => {
      console.log(`📥 Message for user ${clientId}:`, data);
      client.emit('personal', data);
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const clientId = client.handshake.query.clientId as string;
    console.log(`Unsubscribing: ${clientId}`);
    this.natsService.unsubscribeNATS(`nats.user.${clientId}`);
  }

  @SubscribeMessage('sendToUser')
  async sendToUser(client: Socket, payload: { userId: string; message: any }) {
    console.log('🔥 WEBSOCKET -> sendToUser');
    console.log(payload);
    await this.natsService.publishNats(`nats.user.${payload.userId}`, {
      userId: payload.userId,
      message: payload.message,
    });
  }

  @SubscribeMessage('sendBroadcast')
  async sendBroadcast(client: Socket, message: any) {
    await this.natsService.publishNats('nats.broadcast', message);
  }
}
