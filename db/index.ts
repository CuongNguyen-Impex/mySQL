import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema.mysql";

process.env.DATABASE_URL = 'mysql://nhimplzz_impex:Impex2025@103.124.95.161:3306/nhimplzz_ImpexMySQL'; // Cập nhật đường dẫn DATABASE_URL

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionOptions = {
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  connectTimeout: 60000, 
  waitForConnections: true,
};

export const pool = createPool(connectionOptions);
export const db = drizzle(pool, { schema, mode: "default" }); // Thêm chế độ "default"