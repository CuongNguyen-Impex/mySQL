import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from '@neondatabase/serverless';

const PgSession = connectPgSimple(session);

// Create a new pool using the DATABASE_URL environment variable
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the storage middleware
export const storage = session({
  store: new PgSession({
    pool: sessionPool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
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
