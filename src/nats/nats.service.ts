import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, NatsConnection, StringCodec, Subscription } from 'nats';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private natsConnection: NatsConnection;
  private readonly sc = StringCodec();
  private subs: Map<string, Subscription> = new Map(); // Track subscriptions

  async onModuleInit() {
    try {
      this.natsConnection = await connect({
        servers: `${process.env.NATS_SERVER}`,
      });

      console.log(`✅ Connected to NATS: ${this.natsConnection.getServer()}`);
    } catch (e) {
      console.error(e);
      throw new Error(`Error connecting to ${process.env.NATS_SERVER}`);
    }
  }

  async onModuleDestroy() {
    await this.natsConnection.drain();
    console.log('❌ NATS disconnected');
  }

  getConnection(): NatsConnection {
    return this.natsConnection;
  }

  // Publish (send message)
  async publishNats(subject: string, message: any) {
    const data = this.sc.encode(JSON.stringify(message));
    this.natsConnection.publish(subject, data);
  }

  // Subscribe (receive messages)
  subscribeNATS(subject: string, callback: (data: any) => void): Subscription {
    try {
      const result: Subscription = this.subs.get(subject);
      if (result) {
        console.log('Already subscribed skipping...');
        return;
      }
      const sub = this.natsConnection.subscribe(subject);

      (async () => {
        for await (const m of sub) {
          const decoded = this.sc.decode(m.data);
          try {
            const json = JSON.parse(decoded);
            callback(json);
          } catch {
            callback(decoded);
          }
        }
      })();

      //Add the current subject to Map<string, Subscription>
      this.subs.set(subject, sub);
      return sub;
    } catch (e) {
      console.error(e);
      console.error(`❌ Error subscring NATS at ${subject}`);
    }
  }

  async unsubscribeNATS(subject: string) {
    // if (!sub) return;
    this.subs.forEach((subscription: Subscription) => {
      if (subscription.getSubject() === subject) {
        // subscription.unsubscribe();
        if (subscription) subscription.unsubscribe();
        this.subs.delete(subject);
      }
    });
  }

  // handleNATScallback(topic: string, data: any) {
  //   console.log(`📥 [NATS]:`, {
  //     ...data,
  //     topic: topic,
  //   });
  // }

  // handleNATScallbackBroadCast(topic: string, data: any) {
  //   console.log(`📥 [NATS] BROADCAST:`, {
  //     ...data,
  //     topic: topic,
  //   });
  // }
}
