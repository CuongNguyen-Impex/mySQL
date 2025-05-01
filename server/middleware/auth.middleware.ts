import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Add userId to Request interface
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is logged in via session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        message: "Unauthorized - please log in"
      });
    }
    
    // Get user info to verify user exists and get role
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId),
      columns: {
        id: true,
        username: true,
        role: true
      }
    });
    
    if (!user) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error("Error destroying invalid session:", err);
      });
      
      return res.status(401).json({
        message: "Unauthorized - user no longer exists"
      });
    }
    
    // Add user info to request for use in route handlers
    req.userId = user.id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      message: "Internal server error during authentication"
    });
  }
};

// Middleware that doesn't require authentication but will add user info if authenticated
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If session has user ID, get user info
    if (req.session && req.session.userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: {
          id: true,
          username: true,
          role: true
        }
      });
      
      if (user) {
        req.userId = user.id;
        req.userRole = user.role;
      }
    }
    
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Just continue without user info on error
    next();
  }
};

// Admin-only middleware
export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify user is authenticated first
    if (!req.userId || !req.userRole) {
      return res.status(401).json({
        message: "Unauthorized - please log in"
      });
    }
    
    // Check if user is an admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        message: "Forbidden - admin access required"
      });
    }
    
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      message: "Internal server error during authorization"
    });
  }
};
