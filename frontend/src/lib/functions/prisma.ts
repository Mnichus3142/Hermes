import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const dbConfig = {
  user: 'postgres',
  password: 'zaq1@WSX',
  host: 'localhost',
  port: 5432,
  database: 'defaultdb',
};

const pool = new pg.Pool(dbConfig);

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export default prisma;