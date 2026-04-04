import { Product } from '../entities/product';

export const PRODUCT_REPOSITORY = 'IProductRepository';

export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findBySagaId(sagaId: string): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
