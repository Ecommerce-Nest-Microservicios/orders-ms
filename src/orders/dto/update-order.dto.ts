import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
