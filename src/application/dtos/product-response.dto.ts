import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'sw-vol-1' })
  id: string;

  @ApiProperty({ example: 'Star Wars - Vol. 1: A New Hope' })
  name: string;

  @ApiProperty({ example: 20.0 })
  price: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiProperty({ example: 'The saga begins.' })
  description: string;

  @ApiProperty({ example: 'https://example.com/sw-vol-1.jpg' })
  imageUrl: string;

  @ApiPropertyOptional({ example: 'star-wars', nullable: true })
  sagaId: string | null;

  @ApiPropertyOptional({ example: 'Star Wars', nullable: true })
  sagaName: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  volumeNumber: number | null;
}
