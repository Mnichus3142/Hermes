import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: 'postgresql://postgres:zaq1%40WSX@localhost:5432/defaultdb',
    // url: process.env.DATABASE_URL,
  },
});