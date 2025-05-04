import { IsEnum, IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { object } from 'joi';
console.log(OrderStatus);
export class OrderPaginationDto {
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsPositive()
  @Min(0)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsEnum(OrderStatus, {
    message: `Possible satus values are ${[OrderStatus.CANCELLED, OrderStatus.DELIVERED, OrderStatus.PENDING, OrderStatus.PAID]} ${Object.keys(OrderStatus).join(',')}`,
  })
  status?: OrderStatus;
}

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsPositive()
  @Min(0)
  @Type(() => Number)
  limit?: number;
}
