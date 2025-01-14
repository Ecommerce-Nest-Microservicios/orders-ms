import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  DATABASE_URL: process.env.DATABASE_URL,
  NATS_SERVERS: process.env.NATS_SERVERS,
}));
