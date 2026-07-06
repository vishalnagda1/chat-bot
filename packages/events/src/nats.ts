import { connect, NatsConnection, StringCodec } from "nats";

const codec = StringCodec();
let connection: NatsConnection | null = null;

export async function connectNats(url: string): Promise<NatsConnection> {
  if (connection) return connection;

  connection = await connect({ servers: url });
  console.log(`Connected to NATS at ${url}`);

  connection.closed().then(() => {
    console.log("NATS connection closed");
    connection = null;
  });

  return connection;
}

export async function publishEvent(subject: string, data: unknown): Promise<void> {
  if (!connection) {
    console.warn("NATS not connected, event not published:", subject);
    return;
  }

  const payload = codec.encode(JSON.stringify(data));
  connection.publish(subject, payload);
}

export async function closeNats(): Promise<void> {
  if (connection) {
    await connection.drain();
    connection = null;
  }
}
