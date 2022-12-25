import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MutationOutput {
  @Field(() => String, { nullable: true })
  error?: string;

  @Field(() => Boolean)
  success: boolean;
}
