import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartItemRequestDto {
  @ApiProperty({ example: 'sw-vol-1', description: 'Product identifier' })
  @IsString()
  @IsNotEmpty({ message: 'productId must not be empty' })
  productId: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Number of units' })
  @IsInt()
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;
}

export class CartRequestDto {
  @ApiProperty({
    type: [CartItemRequestDto],
    description: 'List of items to price',
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Cart must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CartItemRequestDto)
  items: CartItemRequestDto[];
}
