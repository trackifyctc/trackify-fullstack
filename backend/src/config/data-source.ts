import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, `../../.env.${process.env.NODE_ENV || 'development'}`) });
console.log('process.env.POSTGRES_USER', process.env.POSTGRES_USER);
export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'trackify-db',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: true,
});
