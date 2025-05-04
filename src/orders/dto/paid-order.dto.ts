import { IsNotEmpty, IsString, IsUrl, IsUUID } from 'class-validator';

export class PaidOrderDto {
  @IsNotEmpty()
  @IsString()
  stripePaymentId: string;

  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsUrl()
  receiptUrl: string;
}
