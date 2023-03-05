import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Orders } from '../entities/order.entity';

@InputType()
export class TakeOrderInput extends PickType(Orders, ['id']) {}

@ObjectType()
export class TakeOrderOutput extends CoreOutput {}
