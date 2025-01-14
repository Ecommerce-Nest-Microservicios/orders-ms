import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import {
  IOrder,
  IOrderItemFiltered,
  IOrderServiceResponse,
  IOrdersServiceResponse,
  IProductsServiceResponse,
} from './interfaces/orders.interface';
import { PrismaService } from 'src/database/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto, PaginationDto } from 'src/common/dto/pagination.dto';
import { NATS_SERVICE } from 'src/config/microservices';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  create(createOrderDto: CreateOrderDto): Observable<IOrderServiceResponse> {
    const productIds = createOrderDto.items.map((order) => order.productId);
    return this.client.send('validateProductsExists', productIds).pipe(
      switchMap(({ data: productsFound }: IProductsServiceResponse) => {
        const { items } = createOrderDto;
        let sanitizedProducts: IOrderItemFiltered[];

        if (Array.isArray(productsFound)) {
          sanitizedProducts = items.map((item) => ({
            ...item,
            price: productsFound.find((product) => product.id === item.productId).price,
          }));
        }

        const totalAmount = Array.isArray(sanitizedProducts)
          ? items.reduce((acc, item) => {
              return (acc += item.price * item.quantity);
            }, 0)
          : 0;

        const totalItems = Array.isArray(sanitizedProducts)
          ? sanitizedProducts.reduce((acc, orderItem) => acc + orderItem.quantity, 0)
          : 0;

        return from(
          this.prisma.order.create({
            data: {
              totalItems,
              totalAmount,
              OrderItems: {
                createMany: {
                  data: [...sanitizedProducts],
                },
              },
            },
            include: {
              OrderItems: {
                select: {
                  price: true,
                  quantity: true,
                  productId: true,
                },
              },
            },
          }),
        ).pipe(
          map((orderSaved) => {
            return {
              ok: true,
              message: 'Order created!',
              data: {
                ...orderSaved,
                OrderItems: orderSaved.OrderItems.map((item) => {
                  const productName = productsFound.find((product) => product.id === item.productId).name;
                  return {
                    ...item,
                    name: productName,
                  };
                }),
              },
            };
          }),
          catchError((error) => {
            throw error instanceof RpcException
              ? error
              : new RpcException({
                  message: error.message || 'Unexpected error occurred',
                  error: error.code || 'Internal Server Error',
                  code: 500,
                });
          }),
        );
      }),
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  findAll(paginationDto: PaginationDto): Observable<IOrdersServiceResponse> {
    const { page = 1, limit = 6 } = paginationDto;
    const offset = Math.abs(page - 1) * limit;
    return from(
      Promise.all([
        this.prisma.order.findMany({
          take: limit,
          skip: offset,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.order.count(),
      ]),
    ).pipe(
      map(([orders, totalCount]) => {
        if (!orders.length) {
          throw new RpcException({
            message: `No orders found for the given criteria.`,
            error: 'Not Found',
            code: 404,
          });
        } else {
          const totalPages = Math.ceil(totalCount / limit);
          const nextPage = page < totalPages ? page + 1 : null;
          const prevPage = page > 1 ? page - 1 : null;

          return {
            ok: true,
            message: 'orders fetched!',
            data: orders,
            totalCount,
            count: orders.length,
            totalPages,
            nextPage,
            prevPage,
          };
        }
      }),
      catchError((error) => {
        throw error instanceof RpcException
          ? error
          : new RpcException({
              message: error.message || 'Unexpected error occurred',
              error: error.code || 'Internal Server Error',
              code: 500,
            });
      }),
    );
  }

  findAllByStatus(orderPaginationDto: OrderPaginationDto): Observable<IOrdersServiceResponse> {
    const { page = 1, limit = 15, status } = orderPaginationDto;
    const offset = Math.abs(page - 1) * limit;
    return from(
      Promise.all([
        this.prisma.order.findMany({
          take: limit,
          skip: offset,
          where: {
            status: status,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.order.count({
          where: {
            status: status,
          },
        }),
      ]),
    ).pipe(
      map(([orders, totalCount]) => {
        if (!orders.length) {
          throw new RpcException({
            message: `No orders found for the given criteria.`,
            error: 'Not Found',
            code: 404,
          });
        } else {
          const totalPages = Math.ceil(totalCount / limit);
          const nextPage = page < totalPages ? page + 1 : null;
          const prevPage = page > 1 ? page - 1 : null;

          return {
            ok: true,
            message: 'orders fetched!',
            data: orders,
            totalCount,
            count: orders.length,
            totalPages,
            nextPage,
            prevPage,
          };
        }
      }),
      catchError((error) => {
        throw error instanceof RpcException
          ? error
          : new RpcException({
              message: error.message || 'Unexpected error occurred',
              error: error.code || 'Internal Server Error',
              code: 500,
            });
      }),
    );
  }

  findOne(id: string): Observable<IOrderServiceResponse> {
    return from(
      this.prisma.order.findFirst({
        where: {
          id: id,
        },
        include: {
          OrderItems: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      }),
    ).pipe(
      switchMap((order) => {
        if (!order) {
          throw new RpcException({
            message: `No product found for the given criteria.`,
            error: 'Not Found',
            code: 404,
          });
        } else {
          const productIds = order.OrderItems.map((order) => order.productId);

          return this.client.send('validateProductsExists', productIds).pipe(
            map(({ data: productsFound }: IProductsServiceResponse) => {
              if (!order) {
                throw new RpcException({
                  message: `No order found for the given criteria.`,
                  error: 'Not Found',
                  code: 404,
                });
              } else {
                return {
                  ok: true,
                  message: 'Order fetched!',
                  data: {
                    ...order,
                    OrderItems: order.OrderItems.map((item) => {
                      const productName = productsFound.find((product) => product.id === item.productId).name;

                      return {
                        ...item,
                        name: productName,
                      };
                    }),
                  },
                };
              }
            }),
          );
        }
      }),
      catchError((error) => {
        throw error instanceof RpcException
          ? error
          : new RpcException({
              message: error.message || 'Unexpected error occurred',
              error: error.code || 'Internal Server Error',
              code: 500,
            });
      }),
    );
  }

  changeStatus(updateOrderDto: UpdateOrderDto): Observable<IOrderServiceResponse> {
    const { id, ...order } = updateOrderDto;
    return this.findOne(id).pipe(
      switchMap(({ data }) => {
        if (data.status === order.status) {
          return of({
            ok: true,
            message: 'Order already updated!',
            data: data,
          });
        }

        return from(
          this.prisma.order.update({
            data: order,
            where: {
              id,
            },
          }),
        ).pipe(
          map((orderUpdated) => {
            return {
              ok: true,
              message: 'Order updated!',
              data: orderUpdated,
            };
          }),
          catchError((error) => {
            throw error instanceof RpcException
              ? error
              : new RpcException({
                  message: error.message || 'Unexpected error occurred',
                  error: error.code || 'Internal Server Error',
                  code: 500,
                });
          }),
        );
      }),
    );
  }

  remove(id: string): Observable<IOrderServiceResponse> {
    return this.findOne(id).pipe(
      switchMap(() => {
        return from(
          this.prisma.order.delete({
            where: {
              id,
            },
          }),
        ).pipe(
          map((orderDeleted) => {
            return {
              ok: true,
              message: 'Order deleted!',
              data: orderDeleted,
            };
          }),
          catchError((error) => {
            throw error instanceof RpcException
              ? error
              : new RpcException({
                  message: error.message || 'Unexpected error occurred',
                  error: error.code || 'Internal Server Error',
                  code: 500,
                });
          }),
        );
      }),
    );
  }
}
