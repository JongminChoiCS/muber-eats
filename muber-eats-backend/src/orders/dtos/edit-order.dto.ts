import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Orders } from '../entities/order.entity';

@InputType()
export class EditOrderInput extends PickType(Orders, ['id', 'status']) {}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}
