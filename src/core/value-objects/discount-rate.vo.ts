export class DiscountRate {
  private constructor(private readonly _value: number) {
    if (_value < 0 || _value > 100) {
      throw new Error(`Discount rate must be between 0 and 100, got ${_value}`);
    }
  }

  static of(value: number): DiscountRate {
    return new DiscountRate(value);
  }

  static zero(): DiscountRate {
    return new DiscountRate(0);
  }

  get value(): number {
    return this._value;
  }

  isZero(): boolean {
    return this._value === 0;
  }

  equals(other: DiscountRate): boolean {
    return this._value === other._value;
  }
}
