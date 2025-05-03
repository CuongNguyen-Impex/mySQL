import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "@db";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { adminUser } from "../mock-data";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    // Khi ở trên Replit, sử dụng dữ liệu mẫu nếu đăng nhập bằng tài khoản admin/adminadmin
    if (username === "admin" && password === "adminadmin") {
      // Save user to session
      req.session.userId = adminUser.id;

      return res.status(200).json({
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role
        }
      });
    }

    // Nếu không phải admin mặc định, thử kết nối với database
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.username, username)
      });

      if (!user) {
        return res.status(401).json({
          message: "Invalid credentials"
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid credentials"
        });
      }

      // Save user to session
      req.session.userId = user.id;

      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (dbError) {
      console.error("Database error during login:", dbError);
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error during login"
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    // Chỉ cho phép admin/adminadmin đăng ký trên Replit
    if (req.body.username === "admin" && req.body.password === "adminadmin") {
      // Tạo session cho admin mặc định
      req.session.userId = adminUser.id;

      return res.status(201).json({
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role
        }
      });
    }

    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, userData.username)
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user - MySQL không hỗ trợ .returning()
      const result = await db.insert(users).values({
        username: userData.username,
        password: hashedPassword,
        role: userData.role || "user",
        canManageCategories: userData.role === "admin",
        canEditBills: userData.role === "admin",
        canCreateBills: userData.role === "admin",
        canViewRevenueAndPricing: userData.role === "admin"
      });
      
      // Lấy id của người dùng mới tạo
      const userId = result.insertId;

      // Lấy thông tin người dùng mới tạo
      const newUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          username: true,
          role: true
        }
      });

      if (!newUser) {
        return res.status(500).json({
          message: "Error retrieving new user"
        });
      }

      // Save user to session
      req.session.userId = newUser.id;

      return res.status(201).json({
        user: newUser
      });
    } catch (dbError) {
      console.error("Database error during registration:", dbError);
      return res.status(500).json({
        message: "Server error during registration"
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error during registration"
    });
  }
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        message: "Error logging out"
      });
    }
    
    return res.status(200).json({
      message: "Logged out successfully"
    });
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }

    // Nếu userId trong session là 1 (admin mặc định)
    if (req.session.userId === 1) {
      return res.status(200).json({
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      });
    }

    // Nếu không phải admin mặc định, thử kết nối với database
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: {
          id: true,
          username: true,
          role: true
        }
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      return res.status(200).json(user);
    } catch (dbError) {
      console.error("Database error getting current user:", dbError);
      return res.status(404).json({
        message: "User not found"
      });
    }
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      message: "Server error getting current user"
    });
  }
};
