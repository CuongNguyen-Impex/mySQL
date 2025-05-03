import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema.mysql";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Tạo kết nối MySQL với cấu hình timeout cao hơn 
const connectionOptions = {
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  connectTimeout: 60000, // Tăng timeout lên 60 giây
  waitForConnections: true,
};

export const pool = createPool(connectionOptions);
export const db = drizzle(pool, { schema, mode: 'default' });