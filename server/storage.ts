import session from 'express-session';
import mysql from 'mysql2/promise';
import MySQLStore from 'express-mysql-session';

// Create the MySQL session store
const options = {
  connectionLimit: 10,
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: parseInt(process.env.PGPORT || '3306')
};

// @ts-ignore - express-mysql-session has type issues
const MySQLStoreInstance = MySQLStore(session);

// Create the storage middleware
export const storage = session({
  store: new MySQLStoreInstance(options),
  secret: process.env.SESSION_SECRET || 'logistics-manager-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
});

// Type declaration to extend express session
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}
