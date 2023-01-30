import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { CraeteOrderInput, CreateOrderOuput } from './dtos/create-order.dto';
import { Orders } from './entities/order.entity';
import { OrderService } from './order.service';

@Resolver(() => Orders)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => CreateOrderOuput)
  @Role(['Client'])
  async createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CraeteOrderInput,
  ): Promise<CreateOrderOuput> {
    return this.orderService.createOrder(customer, createOrderInput);
  }
}
