import { OrderStatus } from '@prisma/client';

export interface IOrder {
  id: string;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  paid?: boolean;
  paidAt: Date | null;
  OrderItems?: IOrderItemFiltered[];
  paymentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface IOrderItemFiltered {
  productId: number;
  quantity: number;
  price: number;
  name?: string;
}
export interface IOrderServiceResponse {
  ok: boolean;
  message: string;
  data: IOrder;
}
export interface IOrdersServiceResponse {
  ok: boolean;
  message: string;
  data: IOrder[];
  count?: number;
  totalCount?: number;
  nextPage?: number | null;
  prevPage?: number | null;
  totalPages?: number | null;
}

export interface IProduct {
  id: number;
  name: string;
  price: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductServiceResponse {
  ok: boolean;
  message: string;
  data: IProduct;
}
export interface IProductsServiceResponse {
  ok: boolean;
  message: string;
  data: IProduct[];
  count?: number;
  totalCount?: number;
  nextPage?: number | null;
  prevPage?: number | null;
  totalPages?: number | null;
}
