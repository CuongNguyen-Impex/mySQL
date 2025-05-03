import { db } from "../db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";

async function createDefaultAdmin() {
  try {
    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });

    if (existingAdmin) {
      console.log("Admin account already exists");
      return;
    }

    // Tạo mật khẩu mặc định là 'adminadmin'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("adminadmin", salt);

    // Tạo tài khoản admin
    const [newAdmin] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      canManageCategories: true,
      canEditBills: true,
      canCreateBills: true,
      canViewRevenueAndPricing: true
    }).returning({id: users.id});

    console.log(`Created default admin account with ID ${newAdmin.id}`);
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
}

createDefaultAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
