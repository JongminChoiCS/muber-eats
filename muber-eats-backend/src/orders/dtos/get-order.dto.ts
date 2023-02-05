import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Orders } from '../entities/order.entity';

@InputType()
export class GetOrderInput extends PickType(Orders, ['id']) {}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
  @Field(() => Orders, { nullable: true })
  order?: Orders;
}
