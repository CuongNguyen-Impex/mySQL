import { Request, Response } from "express";
import { db } from "@db";
import { users, updateUserPermissionsSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";

export const getUsers = async (req: Request, res: Response) => {
  try {
    // Chỉ người dùng quyền admin mới có thể xem danh sách người dùng
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        message: "Bạn không có quyền xem danh sách người dùng"
      });
    }

    const usersList = await db.query.users.findMany({
      columns: {
        id: true,
        username: true,
        role: true,
        canManageCategories: true,
        canEditBills: true,
        canCreateBills: true,
        canViewRevenueAndPricing: true,
        createdAt: true
      }
    });

    return res.status(200).json(usersList);
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách người dùng"
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Chỉ người dùng quyền admin mới có thể xem thông tin người dùng khác
    if (req.userRole !== 'admin' && req.userId !== parseInt(id)) {
      return res.status(403).json({
        message: "Bạn không có quyền xem thông tin người dùng này"
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
      columns: {
        id: true,
        username: true,
        role: true,
        canManageCategories: true,
        canEditBills: true,
        canCreateBills: true,
        canViewRevenueAndPricing: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng"
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy thông tin người dùng"
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    // Chỉ admin mới có thể tạo người dùng mới
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        message: "Bạn không có quyền tạo người dùng mới"
      });
    }

    const { username, password, role, canManageCategories, canEditBills, canCreateBills, canViewRevenueAndPricing } = req.body;

    // Kiểm tra username đã tồn tại chưa
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Tên đăng nhập đã tồn tại"
      });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo người dùng mới
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      role: role || "user",
      canManageCategories: canManageCategories || false,
      canEditBills: canEditBills || false,
      canCreateBills: canCreateBills || false,
      canViewRevenueAndPricing: canViewRevenueAndPricing || false
    }).returning({
      id: users.id,
      username: users.username,
      role: users.role,
      canManageCategories: users.canManageCategories,
      canEditBills: users.canEditBills,
      canCreateBills: users.canCreateBills,
      canViewRevenueAndPricing: users.canViewRevenueAndPricing
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Lỗi dữ liệu đầu vào",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Lỗi server khi tạo người dùng mới"
    });
  }
};

export const updateUserPermissions = async (req: Request, res: Response) => {
  try {
    // Chỉ admin mới có thể cập nhật quyền người dùng
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật quyền người dùng"
      });
    }

    const { id } = req.params;
    
    // Kiểm tra người dùng tồn tại
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id))
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng"
      });
    }

    // Admin không thể thay đổi quyền của admin khác
    if (existingUser.role === 'admin' && existingUser.id !== req.userId) {
      return res.status(403).json({
        message: "Không thể thay đổi quyền của admin khác"
      });
    }

    try {
      // Xác thực dữ liệu đầu vào
      const validatedData = updateUserPermissionsSchema.parse(req.body);
      
      // Cập nhật quyền người dùng
      const [updatedUser] = await db.update(users)
        .set({
          canManageCategories: validatedData.canManageCategories,
          canEditBills: validatedData.canEditBills,
          canCreateBills: validatedData.canCreateBills,
          canViewRevenueAndPricing: validatedData.canViewRevenueAndPricing
        })
        .where(eq(users.id, parseInt(id)))
        .returning({
          id: users.id,
          username: users.username,
          role: users.role,
          canManageCategories: users.canManageCategories,
          canEditBills: users.canEditBills,
          canCreateBills: users.canCreateBills,
          canViewRevenueAndPricing: users.canViewRevenueAndPricing
        });

      return res.status(200).json(updatedUser);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        const error = fromZodError(validationError);
        return res.status(400).json({
          message: "Lỗi dữ liệu đầu vào",
          errors: error.details
        });
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error updating user permissions:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật quyền người dùng"
    });
  }
};

export const updateUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Kiểm tra nếu người dùng đang cố thay đổi mật khẩu của người khác
    if (req.userRole !== 'admin' && req.userId !== parseInt(id)) {
      return res.status(403).json({
        message: "Bạn không có quyền thay đổi mật khẩu của người dùng khác"
      });
    }

    // Lấy thông tin người dùng
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id))
    });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng"
      });
    }

    // Xác minh mật khẩu hiện tại nếu không phải admin
    if (req.userRole !== 'admin') {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          message: "Mật khẩu hiện tại không chính xác"
        });
      }
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, parseInt(id)));

    return res.status(200).json({
      message: "Cập nhật mật khẩu thành công"
    });
  } catch (error) {
    console.error("Error updating user password:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật mật khẩu"
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    // Chỉ admin mới có thể xóa người dùng
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        message: "Bạn không có quyền xóa người dùng"
      });
    }

    const { id } = req.params;
    
    // Kiểm tra người dùng tồn tại
    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id))
    });

    if (!userToDelete) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng"
      });
    }

    // Không cho phép xóa chính mình
    if (parseInt(id) === req.userId) {
      return res.status(400).json({
        message: "Không thể xóa tài khoản của chính mình"
      });
    }

    // Xóa người dùng
    await db.delete(users).where(eq(users.id, parseInt(id)));

    return res.status(200).json({
      message: "Xóa người dùng thành công"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      message: "Lỗi server khi xóa người dùng"
    });
  }
};
