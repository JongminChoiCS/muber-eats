import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/cetegory.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import {
  CategoryResolver,
  DishResolver,
  RestaurantResolver,
} from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
  providers: [
    RestaurantResolver,
    CategoryResolver,
    DishResolver,
    RestaurantService,
  ],
})
export class RestaurantsModule {}
