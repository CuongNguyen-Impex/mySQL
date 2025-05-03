import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { adminUser } from "../mock-data";

// Add user info to Request interface
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
      userPermissions?: {
        canManageCategories: boolean;
        canEditBills: boolean;
        canCreateBills: boolean;
        canViewRevenueAndPricing: boolean;
      }
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
    
    // Nếu userId trong session là 1 (admin mặc định trên Replit)
    if (req.session.userId === 1) {
      req.userId = adminUser.id;
      req.userRole = adminUser.role;
      req.userPermissions = {
        canManageCategories: adminUser.canManageCategories,
        canEditBills: adminUser.canEditBills,
        canCreateBills: adminUser.canCreateBills,
        canViewRevenueAndPricing: adminUser.canViewRevenueAndPricing
      };
      
      return next();
    }
    
    try {
      // Get user info to verify user exists and get role and permissions
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: {
          id: true,
          username: true,
          role: true,
          canManageCategories: true,
          canEditBills: true,
          canCreateBills: true,
          canViewRevenueAndPricing: true
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
      req.userPermissions = {
        canManageCategories: user.role === 'admin' ? true : user.canManageCategories,
        canEditBills: user.role === 'admin' ? true : user.canEditBills,
        canCreateBills: user.role === 'admin' ? true : user.canCreateBills,
        canViewRevenueAndPricing: user.role === 'admin' ? true : user.canViewRevenueAndPricing
      };
      
      next();
    } catch (dbError) {
      console.error("Database error in auth middleware:", dbError);
      
      // Nếu lỗi database, vẫn cho phép tiếp tục với admin mặc định
      if (req.session.userId === 1) {
        req.userId = adminUser.id;
        req.userRole = adminUser.role;
        req.userPermissions = {
          canManageCategories: adminUser.canManageCategories,
          canEditBills: adminUser.canEditBills,
          canCreateBills: adminUser.canCreateBills,
          canViewRevenueAndPricing: adminUser.canViewRevenueAndPricing
        };
        
        return next();
      }
      
      return res.status(500).json({
        message: "Internal server error during authentication"
      });
    }
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
      // Nếu userId trong session là 1 (admin mặc định trên Replit)
      if (req.session.userId === 1) {
        req.userId = adminUser.id;
        req.userRole = adminUser.role;
        req.userPermissions = {
          canManageCategories: adminUser.canManageCategories,
          canEditBills: adminUser.canEditBills,
          canCreateBills: adminUser.canCreateBills,
          canViewRevenueAndPricing: adminUser.canViewRevenueAndPricing
        };
        
        return next();
      }
      
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.id, req.session.userId),
          columns: {
            id: true,
            username: true,
            role: true,
            canManageCategories: true,
            canEditBills: true,
            canCreateBills: true,
            canViewRevenueAndPricing: true
          }
        });
        
        if (user) {
          req.userId = user.id;
          req.userRole = user.role;
          req.userPermissions = {
            canManageCategories: user.role === 'admin' ? true : user.canManageCategories,
            canEditBills: user.role === 'admin' ? true : user.canEditBills,
            canCreateBills: user.role === 'admin' ? true : user.canCreateBills,
            canViewRevenueAndPricing: user.role === 'admin' ? true : user.canViewRevenueAndPricing
          };
        }
      } catch (dbError) {
        console.error("Database error in optional auth middleware:", dbError);
        
        // Nếu lỗi database và userId là 1, vẫn cho phép tiếp tục với admin mặc định
        if (req.session.userId === 1) {
          req.userId = adminUser.id;
          req.userRole = adminUser.role;
          req.userPermissions = {
            canManageCategories: adminUser.canManageCategories,
            canEditBills: adminUser.canEditBills,
            canCreateBills: adminUser.canCreateBills,
            canViewRevenueAndPricing: adminUser.canViewRevenueAndPricing
          };
        }
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
