import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class OrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;
}
