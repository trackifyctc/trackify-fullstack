import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  host: string,
  port: number,
  username: string,
  password: string,
  database: string,
  isDev: boolean,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: isDev,
  dropSchema: false,
});
