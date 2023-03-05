import { InputType, PickType } from '@nestjs/graphql';
import { Orders } from '../entities/order.entity';

@InputType()
export class OrderUpdatesInput extends PickType(Orders, ['id']) {}
