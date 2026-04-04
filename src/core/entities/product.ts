import { Money } from '../value-objects/money.vo';

export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly basePrice: Money,
    public readonly description: string,
    public readonly imageUrl: string,
    /** Null when the product does not belong to any saga. */
    public readonly sagaId: string | null = null,
    /** Position of this product within its saga (1-based). */
    public readonly volumeNumber: number | null = null,
  ) {}

  belongsToSaga(): boolean {
    return this.sagaId !== null;
  }
}
