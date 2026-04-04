import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from './infrastructure/persistence/orm-entities/product.orm-entity';
import { PromotionOrmEntity } from './infrastructure/persistence/orm-entities/promotion.orm-entity';
import { PromotionRuleOrmEntity } from './infrastructure/persistence/orm-entities/promotion-rule.orm-entity';
import { SagaOrmEntity } from './infrastructure/persistence/orm-entities/saga.orm-entity';
import { MarketModule } from './web-api/modules/market.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'smart_market_dvd'),
        entities: [
          SagaOrmEntity,
          ProductOrmEntity,
          PromotionOrmEntity,
          PromotionRuleOrmEntity,
        ],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging: false,
      }),
    }),
    MarketModule,
  ],
})
export class AppModule {}
