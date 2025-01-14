import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environments } from './config/environments';
import config from './config/config';
import * as Joi from 'joi';
import { PrismaModule } from './database/prisma.module';
import { OrdersModule } from './orders/orders.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: environments[process.env.NODE_ENV],
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        NATS_SERVERS: Joi.string()
          .custom((value, helpers) => {
            const servers = value.split(',');
            if (servers.every((server: any) => typeof server === 'string')) {
              return servers;
            } else {
              return helpers.message({
                'any.invalid': 'NATS_SERVERS must be a valid list of strings',
              });
            }
          })
          .required(),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    PrismaModule,
    NatsModule,
    OrdersModule,
  ],
})
export class AppModule {}
