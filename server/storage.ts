import session from 'express-session';

// Sử dụng bộ nhớ (memory) để lưu trữ phiên làm giải pháp tạm thời
// trong quá trình chuyển đổi từ PostgreSQL sang MySQL
export const storage = session({
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
