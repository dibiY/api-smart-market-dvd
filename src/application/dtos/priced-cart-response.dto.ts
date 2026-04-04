import { ApiProperty } from '@nestjs/swagger';

export class PricedLineResponseDto {
  @ApiProperty({ example: 'sw-vol-1' })
  productId: string;

  @ApiProperty({ example: 'Star Wars - Vol. 1: A New Hope' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 20.0 })
  unitPrice: number;

  @ApiProperty({ example: 16.0, description: 'Line total after discount' })
  lineTotal: number;

  @ApiProperty({
    example: 20,
    description: 'Discount percentage applied (0–100)',
  })
  discountRate: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;
}

export class PricedCartResponseDto {
  @ApiProperty({ type: [PricedLineResponseDto] })
  lines: PricedLineResponseDto[];

  @ApiProperty({ example: 48.0 })
  total: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;
}
