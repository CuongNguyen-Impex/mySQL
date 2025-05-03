import { db } from "./index";
import { users } from "../shared/schema";
import { hash } from "bcryptjs";

async function createAdmin() {
  try {
    // Xóa tài khoản admin cũ (nếu có)
    await db.delete(users);
    
    // Tạo mật khẩu mới
    const password = "adminadmin"; // Mật khẩu dài hơn 6 ký tự
    const hashedPassword = await hash(password, 10);
    
    // Tạo tài khoản admin mới
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      can_manage_categories: true,
      can_edit_bills: true,
      can_create_bills: true,
      can_view_revenue_pricing: true
    });
    
    console.log(`Đã tạo tài khoản admin với mật khẩu: ${password}`);
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản admin:", error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
