import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "@db";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error during login"
    });
  }
};

export const register = async (req: Request, res: Response) => {
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

    // Create user
    const [newUser] = await db.insert(users).values({
      username: userData.username,
      password: hashedPassword,
      role: userData.role || "user"
    }).returning({
      id: users.id,
      username: users.username,
      role: users.role
    });

    // Save user to session
    req.session.userId = newUser.id;

    return res.status(201).json({
      user: newUser
    });
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
    if (!req.userId) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.userId),
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
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      message: "Server error getting current user"
    });
  }
};
