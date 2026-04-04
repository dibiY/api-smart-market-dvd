import { DiscountRate } from './discount-rate.vo';

export class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string,
  ) {
    if (_amount < 0) {
      throw new Error(`Money amount cannot be negative, got ${_amount}`);
    }
  }

  static of(amount: number, currency = 'EUR'): Money {
    return new Money(Math.round(amount * 100) / 100, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this._amount + other._amount, this._currency);
  }

  multiply(factor: number): Money {
    return Money.of(this._amount * factor, this._currency);
  }

  applyDiscountRate(rate: DiscountRate): Money {
    return Money.of(this._amount * (1 - rate.value / 100), this._currency);
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Currency mismatch: cannot combine ${this._currency} and ${other._currency}`,
      );
    }
  }
}
