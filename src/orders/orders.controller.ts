import { Controller, Logger, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderPaginationDto, PaginationDto } from 'src/common/dto/pagination.dto';

@Controller()
export class OrdersController {
  private readonly logger = new Logger('Orders Microservice');

  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    this.logger.log(`Creating order...`);

    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() paginationDto: PaginationDto) {
    this.logger.log(`Fetching orders...`);
    return this.ordersService.findAll(paginationDto);
  }

  @MessagePattern('findAllOrdersByStatus')
  findAllByStatus(@Payload() orderPaginationDto: OrderPaginationDto) {
    this.logger.log(`Fetching orders by status...`);
    return this.ordersService.findAllByStatus(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Fetching order...`);
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeStatus')
  changeStatus(@Payload() updateOrderDto: UpdateOrderDto) {
    this.logger.log(`Updating order...`);
    return this.ordersService.changeStatus(updateOrderDto);
  }

  @MessagePattern('removeOrder')
  remove(@Payload('id') id: string) {
    this.logger.log(`Removing order...`);
    return this.ordersService.remove(id);
  }
}
