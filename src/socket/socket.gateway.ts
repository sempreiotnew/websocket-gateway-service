import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NatsService } from 'src/nats/nats.service';
import { SocketPayload } from './socket.types';
import { NATS_ACRONYM, WS_ACRONYM } from 'src/constants';

@WebSocketGateway(3005, {
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly natsService: NatsService) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const clientId = client.handshake.query.clientId as string;
    if (!clientId) {
      console.log(`Websocket ID not found ${clientId}`);
      client.disconnect();
      return;
    }

    console.log(
      `🔥 [WEBSOCKET] Client ${client.id} connected as user ${clientId}`,
    );

    const topic = `${NATS_ACRONYM}${clientId}`;
    const room = `${WS_ACRONYM}${clientId}`;
    console.log(topic);
    console.log(room);

    client.join(room);

    this.natsService.subscribeNATS(topic, (data) => {
      this.server.emit(`${WS_ACRONYM}${clientId}`, {
        ...data,
        sent: true,
      });
    });

    this.natsService.subscribeNATS('nats.broadcast', (payload: any) => {
      console.log('BROADCAST');
      console.log(payload);
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const clientId = client.handshake.query.clientId as string;
    console.log(`Unsubscribing: ${clientId}`);
    this.natsService.unsubscribeNATS(`${NATS_ACRONYM}${clientId}`);
  }

  @SubscribeMessage('sendToUser')
  async sendToUser(client: Socket, payload: SocketPayload) {
    console.log(payload);
    await this.natsService.publishNats(
      `${NATS_ACRONYM}${payload.userId}`,
      payload,
    );
  }

  @SubscribeMessage('sendBroadcast')
  async sendBroadcast(client: Socket, payload: SocketPayload) {
    console.log('🔥 [WEBSOCKET] -> sendBroadcast');
    await this.natsService.publishNats('nats.broadcast', payload.message);
  }
}
