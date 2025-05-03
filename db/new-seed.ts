import { db } from "./index";
import {
  users,
  customers,
  services,
  suppliers,
  costTypes,
  costTypeAttributes,
  bills,
  costs,
  revenues,
  prices,
  costPrices,
  settings
} from "../shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

async function resetDatabase() {
  try {
    console.log("Resetting database...");
    
    // Xóa dữ liệu từ các bảng có khóa ngoại trước
    await db.delete(revenues);
    await db.delete(costs);
    await db.delete(costPrices);
    await db.delete(prices);
    await db.delete(bills);
    await db.delete(costTypeAttributes);
    await db.delete(costTypes);
    await db.delete(suppliers);
    await db.delete(services);
    await db.delete(customers);
    
    // Xóa tất cả người dùng trừ admin
    await db.delete(users);
    // Admin sẽ được tạo lại sau
    
    // Xóa cài đặt (ngoại trừ các cài đặt cần thiết)
    await db.delete(settings);
    
    console.log("All data deleted successfully.");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}

async function seedUsers() {
  try {
    // Giữ lại người dùng admin
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, "admin")
    });
    
    if (!existingAdmin) {
      const hashedPassword = await hash("admin", 10);
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        name: "Admin",
        role: "admin",
        permissions: JSON.stringify({
          canManageCategories: true,
          canEditBills: true,
          canCreateBills: true,
          canViewRevenue: true
        })
      });
      console.log("Admin user created.");
    } else {
      console.log("Admin user already exists, skipping creation.");
    }
    
    // Thêm 4 người dùng mới
    const userRoles = [
      { role: "manager", permissions: { canManageCategories: false, canEditBills: true, canCreateBills: true, canViewRevenue: true } },
      { role: "accountant", permissions: { canManageCategories: false, canEditBills: false, canCreateBills: false, canViewRevenue: true } },
      { role: "operator", permissions: { canManageCategories: false, canEditBills: false, canCreateBills: true, canViewRevenue: false } },
      { role: "viewer", permissions: { canManageCategories: false, canEditBills: false, canCreateBills: false, canViewRevenue: false } }
    ];
    
    for (let i = 0; i < 4; i++) {
      const hashedPassword = await hash(`user${i + 1}`, 10);
      await db.insert(users).values({
        username: `user${i + 1}`,
        password: hashedPassword,
        name: `Người dùng ${i + 1}`,
        role: userRoles[i].role,
        permissions: JSON.stringify(userRoles[i].permissions)
      });
    }
    
    console.log("Users seeded successfully.");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

async function seedCustomers() {
  try {
    const customersData = [
      {
        name: "Công ty TNHH Thương mại Minh Phú",
        contactName: "Nguyễn Văn Minh",
        contactEmail: "minh@minhphu.com",
        contactPhone: "0901234567",
        address: "123 Nguyễn Huệ, Quận 1, TP HCM"
      },
      {
        name: "Công ty CP Xuất nhập khẩu Hải Đăng",
        contactName: "Trần Thị Hải",
        contactEmail: "hai@haidang.com",
        contactPhone: "0912345678",
        address: "456 Lê Lợi, Quận 1, TP HCM"
      },
      {
        name: "Công ty Logistics Tân Cảng",
        contactName: "Phạm Văn Tân",
        contactEmail: "tan@tancang.com",
        contactPhone: "0923456789",
        address: "789 Nguyễn Tất Thành, Quận 4, TP HCM"
      },
      {
        name: "Tập đoàn Vận tải Đông Dương",
        contactName: "Lê Thị Đông",
        contactEmail: "dong@dongduong.com",
        contactPhone: "0934567890",
        address: "101 Điện Biên Phủ, Quận 3, TP HCM"
      },
      {
        name: "Công ty TNHH Giao nhận Nam Việt",
        contactName: "Vũ Nam Việt",
        contactEmail: "viet@namviet.com",
        contactPhone: "0945678901",
        address: "202 Cách Mạng Tháng 8, Quận 3, TP HCM"
      }
    ];
    
    for (const customer of customersData) {
      await db.insert(customers).values(customer);
    }
    
    console.log("Customers seeded successfully.");
  } catch (error) {
    console.error("Error seeding customers:", error);
    throw error;
  }
}

async function seedServices() {
  try {
    const servicesData = [
      {
        name: "Dịch vụ vận chuyển đường biển",
        description: "Vận chuyển hàng hóa bằng đường biển quốc tế và nội địa"
      },
      {
        name: "Dịch vụ vận chuyển đường bộ",
        description: "Vận chuyển hàng hóa bằng xe tải trong nước và xuyên biên giới"
      },
      {
        name: "Dịch vụ kho bãi",
        description: "Lưu trữ, quản lý hàng hóa tại kho bãi hiện đại"
      },
      {
        name: "Dịch vụ giao nhận hàng hóa",
        description: "Dịch vụ giao nhận hàng hóa từ kho đến điểm đích"
      },
      {
        name: "Dịch vụ thông quan hải quan",
        description: "Hỗ trợ thủ tục hải quan và giấy tờ xuất nhập khẩu"
      }
    ];
    
    for (const service of servicesData) {
      await db.insert(services).values(service);
    }
    
    console.log("Services seeded successfully.");
  } catch (error) {
    console.error("Error seeding services:", error);
    throw error;
  }
}

async function seedSuppliers() {
  try {
    const suppliersData = [
      {
        name: "Công ty Vận tải Đông Nam",
        contactName: "Lê Văn Đông",
        contactEmail: "dong@dongnam.com",
        contactPhone: "0956789012",
        address: "303 Võ Văn Ngân, TP Thủ Đức, TP HCM"
      },
      {
        name: "Hãng tàu Evergreen",
        contactName: "Trần Thị Xanh",
        contactEmail: "xanh@evergreen.com",
        contactPhone: "0967890123",
        address: "404 Nguyễn Công Trứ, Quận 1, TP HCM"
      },
      {
        name: "Đại lý Hải quan Tiến Phát",
        contactName: "Nguyễn Tiến Phát",
        contactEmail: "phat@tienphat.com",
        contactPhone: "0978901234",
        address: "505 Bến Chương Dương, Quận 1, TP HCM"
      },
      {
        name: "Công ty Dịch vụ Kho vận Thành Công",
        contactName: "Phạm Thành Công",
        contactEmail: "cong@thanhcong.com",
        contactPhone: "0989012345",
        address: "606 Hàm Nghi, Quận 1, TP HCM"
      },
      {
        name: "Hãng vận chuyển Maersk",
        contactName: "Trần Văn Minh",
        contactEmail: "minh@maersk.com",
        contactPhone: "0990123456",
        address: "707 Nguyễn Thị Minh Khai, Quận 3, TP HCM"
      }
    ];
    
    for (const supplier of suppliersData) {
      await db.insert(suppliers).values(supplier);
    }
    
    console.log("Suppliers seeded successfully.");
  } catch (error) {
    console.error("Error seeding suppliers:", error);
    throw error;
  }
}

async function seedCostTypes() {
  try {
    const costTypesData = [
      { name: "Phí vận chuyển", description: "Chi phí vận chuyển hàng hóa" },
      { name: "Phí hải quan", description: "Chi phí thủ tục hải quan" },
      { name: "Phí lưu kho", description: "Chi phí lưu trữ hàng hóa" },
      { name: "Phí bốc xếp", description: "Chi phí bốc xếp hàng hóa" },
      { name: "Phí giấy tờ", description: "Chi phí làm giấy tờ, chứng từ" }
    ];
    
    const costTypeIds = [];
    for (const costType of costTypesData) {
      const result = await db.insert(costTypes).values(costType).returning({ id: costTypes.id });
      costTypeIds.push(result[0].id);
    }
    
    // Tạo thuộc tính cho mỗi loại chi phí
    const attributesData = [
      // Phí vận chuyển
      { costTypeId: costTypeIds[0], name: "Quãng đường", description: "Khoảng cách vận chuyển", order: 1 },
      { costTypeId: costTypeIds[0], name: "Loại xe", description: "Loại phương tiện vận chuyển", order: 2 },
      
      // Phí hải quan
      { costTypeId: costTypeIds[1], name: "Loại hàng", description: "Loại hàng hóa xuất nhập khẩu", order: 1 },
      { costTypeId: costTypeIds[1], name: "Cảng", description: "Cảng xuất nhập", order: 2 },
      
      // Phí lưu kho
      { costTypeId: costTypeIds[2], name: "Thời gian", description: "Thời gian lưu kho", order: 1 },
      { costTypeId: costTypeIds[2], name: "Loại kho", description: "Loại kho bãi", order: 2 },
      
      // Phí bốc xếp
      { costTypeId: costTypeIds[3], name: "Khối lượng", description: "Khối lượng hàng hóa", order: 1 },
      { costTypeId: costTypeIds[3], name: "Thiết bị", description: "Thiết bị bốc xếp", order: 2 },
      
      // Phí giấy tờ
      { costTypeId: costTypeIds[4], name: "Loại giấy tờ", description: "Loại giấy tờ, chứng từ", order: 1 },
      { costTypeId: costTypeIds[4], name: "Số lượng", description: "Số lượng bộ chứng từ", order: 2 }
    ];
    
    for (const attribute of attributesData) {
      await db.insert(costTypeAttributes).values(attribute);
    }
    
    console.log("Cost types and attributes seeded successfully.");
    return costTypeIds;
  } catch (error) {
    console.error("Error seeding cost types:", error);
    throw error;
  }
}

async function seedBills(customerIds, serviceIds) {
  try {
    const billsData = [
      {
        billNo: "BILL-001",
        date: new Date("2025-05-01"),
        customerId: customerIds[0],
        serviceId: serviceIds[0],
        importExportType: "Nhập khẩu",
        packageInfo: "10 container 40",
        goodsType: "Nguyên liệu sản xuất",
        invoiceNo: "INV-2025-001",
        status: "Completed"
      },
      {
        billNo: "BILL-002",
        date: new Date("2025-04-15"),
        customerId: customerIds[1],
        serviceId: serviceIds[1],
        importExportType: "Xuất khẩu",
        packageInfo: "5 container 20",
        goodsType: "Hàng tiêu dùng",
        invoiceNo: "INV-2025-002",
        status: "Completed"
      },
      {
        billNo: "BILL-003",
        date: new Date("2025-04-30"),
        customerId: customerIds[2],
        serviceId: serviceIds[2],
        importExportType: "Nội địa",
        packageInfo: "20 pallet",
        goodsType: "Thực phẩm",
        invoiceNo: "INV-2025-003",
        status: "In Progress"
      },
      {
        billNo: "BILL-004",
        date: new Date("2025-05-02"),
        customerId: customerIds[3],
        serviceId: serviceIds[3],
        importExportType: "Nhập khẩu",
        packageInfo: "15 container 40",
        goodsType: "Máy móc",
        invoiceNo: "INV-2025-004",
        status: "Pending"
      },
      {
        billNo: "BILL-005",
        date: new Date("2025-05-03"),
        customerId: customerIds[4],
        serviceId: serviceIds[4],
        importExportType: "Xuất khẩu",
        packageInfo: "8 container 40",
        goodsType: "Nông sản",
        invoiceNo: "INV-2025-005",
        status: "Completed"
      }
    ];
    
    const billIds = [];
    for (const bill of billsData) {
      const result = await db.insert(bills).values(bill).returning({ id: bills.id });
      billIds.push(result[0].id);
    }
    
    console.log("Bills seeded successfully.");
    return billIds;
  } catch (error) {
    console.error("Error seeding bills:", error);
    throw error;
  }
}

async function seedCosts(billIds, costTypeIds, supplierIds) {
  try {
    const costsData = [
      // Chi phí cho Bill 1
      {
        billId: billIds[0],
        costTypeId: costTypeIds[0], // Phí vận chuyển
        supplierId: supplierIds[0],
        amount: "5000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí vận chuyển từ cảng về kho",
        tt_hd: "Hóa đơn"
      },
      {
        billId: billIds[0],
        costTypeId: costTypeIds[1], // Phí hải quan
        supplierId: supplierIds[2],
        amount: "3000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí làm thủ tục hải quan",
        tt_hd: "Hóa đơn"
      },
      
      // Chi phí cho Bill 2
      {
        billId: billIds[1],
        costTypeId: costTypeIds[0], // Phí vận chuyển
        supplierId: supplierIds[1],
        amount: "6000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí vận chuyển từ kho ra cảng",
        tt_hd: "Hóa đơn"
      },
      {
        billId: billIds[1],
        costTypeId: costTypeIds[3], // Phí bốc xếp
        supplierId: supplierIds[3],
        amount: "2000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí bốc xếp hàng hóa",
        tt_hd: "Trả hộ"
      },
      
      // Chi phí cho Bill 3
      {
        billId: billIds[2],
        costTypeId: costTypeIds[2], // Phí lưu kho
        supplierId: supplierIds[3],
        amount: "4000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí lưu kho 30 ngày",
        tt_hd: "Hóa đơn"
      },
      {
        billId: billIds[2],
        costTypeId: costTypeIds[3], // Phí bốc xếp
        supplierId: supplierIds[3],
        amount: "1500000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí bốc xếp hàng vào kho",
        tt_hd: "Hóa đơn"
      },
      
      // Chi phí cho Bill 4
      {
        billId: billIds[3],
        costTypeId: costTypeIds[0], // Phí vận chuyển
        supplierId: supplierIds[0],
        amount: "7000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí vận chuyển máy móc từ cảng",
        tt_hd: "Hóa đơn"
      },
      {
        billId: billIds[3],
        costTypeId: costTypeIds[1], // Phí hải quan
        supplierId: supplierIds[2],
        amount: "3500000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí thủ tục hải quan máy móc",
        tt_hd: "Hóa đơn"
      },
      {
        billId: billIds[3],
        costTypeId: costTypeIds[4], // Phí giấy tờ
        supplierId: supplierIds[2],
        amount: "1200000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí chứng từ, giấy phép",
        tt_hd: "Trả hộ"
      },
      
      // Chi phí cho Bill 5
      {
        billId: billIds[4],
        costTypeId: costTypeIds[0], // Phí vận chuyển
        supplierId: supplierIds[1],
        amount: "5500000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí vận chuyển nông sản ra cảng",
        tt_hd: "Hóa đơn"
      },
      {
        billId: billIds[4],
        costTypeId: costTypeIds[1], // Phí hải quan
        supplierId: supplierIds[2],
        amount: "2500000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí thủ tục hải quan nông sản",
        tt_hd: "Hóa đơn"
      },
      {
        billId: billIds[4],
        costTypeId: costTypeIds[3], // Phí bốc xếp
        supplierId: supplierIds[3],
        amount: "1800000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí bốc xếp hàng lên tàu",
        tt_hd: "Trả hộ"
      }
    ];
    
    for (const cost of costsData) {
      await db.insert(costs).values(cost);
    }
    
    console.log("Costs seeded successfully.");
  } catch (error) {
    console.error("Error seeding costs:", error);
    throw error;
  }
}

async function seedRevenues(billIds) {
  try {
    const revenuesData = [
      {
        billId: billIds[0],
        serviceId: 1, // Dịch vụ vận chuyển đường biển
        amount: "10000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Doanh thu dịch vụ vận chuyển"
      },
      {
        billId: billIds[1],
        serviceId: 2, // Dịch vụ vận chuyển đường bộ
        amount: "8000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Doanh thu dịch vụ vận chuyển đường bộ"
      },
      {
        billId: billIds[2],
        serviceId: 3, // Dịch vụ kho bãi
        amount: "7000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Doanh thu dịch vụ kho bãi"
      },
      {
        billId: billIds[3],
        serviceId: 4, // Dịch vụ giao nhận hàng hóa
        amount: "12000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Doanh thu dịch vụ giao nhận máy móc"
      },
      {
        billId: billIds[4],
        serviceId: 5, // Dịch vụ thông quan hải quan
        amount: "9000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Doanh thu dịch vụ thông quan"
      }
    ];
    
    for (const revenue of revenuesData) {
      await db.insert(revenues).values(revenue);
    }
    
    console.log("Revenues seeded successfully.");
  } catch (error) {
    console.error("Error seeding revenues:", error);
    throw error;
  }
}

async function seedPrices(customerIds, serviceIds) {
  try {
    const pricesData = [
      {
        customerId: customerIds[0],
        serviceId: serviceIds[0],
        price: "10000000",
        currency: "VND",
        description: "Giá dịch vụ vận chuyển đường biển"
      },
      {
        customerId: customerIds[1],
        serviceId: serviceIds[1],
        price: "8000000",
        currency: "VND",
        description: "Giá dịch vụ vận chuyển đường bộ"
      },
      {
        customerId: customerIds[2],
        serviceId: serviceIds[2],
        price: "7000000",
        currency: "VND",
        description: "Giá dịch vụ kho bãi"
      },
      {
        customerId: customerIds[3],
        serviceId: serviceIds[3],
        price: "12000000",
        currency: "VND",
        description: "Giá dịch vụ giao nhận hàng hóa"
      },
      {
        customerId: customerIds[4],
        serviceId: serviceIds[4],
        price: "9000000",
        currency: "VND",
        description: "Giá dịch vụ thông quan hải quan"
      }
    ];
    
    for (const price of pricesData) {
      await db.insert(prices).values(price);
    }
    
    console.log("Prices seeded successfully.");
  } catch (error) {
    console.error("Error seeding prices:", error);
    throw error;
  }
}

async function seedCostPrices(customerIds, serviceIds, costTypeIds) {
  try {
    const costPricesData = [
      // Giá chi phí cho khách hàng 1, dịch vụ 1
      {
        customerId: customerIds[0],
        serviceId: serviceIds[0],
        costTypeId: costTypeIds[0], // Phí vận chuyển
        price: "7000000",
        currency: "VND",
        description: "Giá vận chuyển đường biển cho Minh Phú"
      },
      {
        customerId: customerIds[0],
        serviceId: serviceIds[0],
        costTypeId: costTypeIds[1], // Phí hải quan
        price: "4500000",
        currency: "VND",
        description: "Giá thủ tục hải quan cho Minh Phú"
      },
      
      // Giá chi phí cho khách hàng 2, dịch vụ 2
      {
        customerId: customerIds[1],
        serviceId: serviceIds[1],
        costTypeId: costTypeIds[0], // Phí vận chuyển
        price: "8000000",
        currency: "VND",
        description: "Giá vận chuyển đường bộ cho Hải Đăng"
      },
      
      // Giá chi phí cho khách hàng 3, dịch vụ 3
      {
        customerId: customerIds[2],
        serviceId: serviceIds[2],
        costTypeId: costTypeIds[2], // Phí lưu kho
        price: "5000000",
        currency: "VND",
        description: "Giá lưu kho cho Tân Cảng"
      },
      {
        customerId: customerIds[2],
        serviceId: serviceIds[2],
        costTypeId: costTypeIds[3], // Phí bốc xếp
        price: "2000000",
        currency: "VND",
        description: "Giá bốc xếp cho Tân Cảng"
      },
      
      // Giá chi phí cho khách hàng 4, dịch vụ 4
      {
        customerId: customerIds[3],
        serviceId: serviceIds[3],
        costTypeId: costTypeIds[0], // Phí vận chuyển
        price: "9000000",
        currency: "VND",
        description: "Giá vận chuyển cho Đông Dương"
      },
      {
        customerId: customerIds[3],
        serviceId: serviceIds[3],
        costTypeId: costTypeIds[1], // Phí hải quan
        price: "4000000",
        currency: "VND",
        description: "Giá thủ tục hải quan cho Đông Dương"
      },
      
      // Giá chi phí cho khách hàng 5, dịch vụ 5
      {
        customerId: customerIds[4],
        serviceId: serviceIds[4],
        costTypeId: costTypeIds[0], // Phí vận chuyển
        price: "7500000",
        currency: "VND",
        description: "Giá vận chuyển cho Nam Việt"
      },
      {
        customerId: customerIds[4],
        serviceId: serviceIds[4],
        costTypeId: costTypeIds[1], // Phí hải quan
        price: "3500000",
        currency: "VND",
        description: "Giá thủ tục hải quan cho Nam Việt"
      },
      {
        customerId: customerIds[4],
        serviceId: serviceIds[4],
        costTypeId: costTypeIds[3], // Phí bốc xếp
        price: "2500000",
        currency: "VND",
        description: "Giá bốc xếp cho Nam Việt"
      }
    ];
    
    for (const costPrice of costPricesData) {
      await db.insert(costPrices).values(costPrice);
    }
    
    console.log("Cost prices seeded successfully.");
  } catch (error) {
    console.error("Error seeding cost prices:", error);
    throw error;
  }
}

async function seedSettings() {
  try {
    const settingsData = [
      {
        key: "company_name",
        value: "CÔNG TY TNHH DỊCH VỤ LOGISTICS VIỆT NAM",
        description: "Tên công ty"
      },
      {
        key: "company_address",
        value: "123 Nguyễn Huệ, Quận 1, TP Hồ Chí Minh",
        description: "Địa chỉ công ty"
      },
      {
        key: "company_phone",
        value: "028 1234 5678",
        description: "Số điện thoại công ty"
      },
      {
        key: "company_email",
        value: "info@vietlogistics.com",
        description: "Email công ty"
      },
      {
        key: "company_tax_code",
        value: "0123456789",
        description: "Mã số thuế công ty"
      }
    ];
    
    for (const setting of settingsData) {
      await db.insert(settings).values(setting);
    }
    
    console.log("Settings seeded successfully.");
  } catch (error) {
    console.error("Error seeding settings:", error);
    throw error;
  }
}

async function main() {
  try {
    // Xóa toàn bộ dữ liệu hiện có
    await resetDatabase();
    
    // Thêm dữ liệu mới
    await seedUsers();
    
    // Thêm dữ liệu cho các bảng chính
    const customersData = await db.insert(customers).values([]).returning({ id: customers.id });
    const customerIds = (await seedCustomers()).map((c: any) => c.id);
    
    const servicesData = await db.insert(services).values([]).returning({ id: services.id });
    const serviceIds = (await seedServices()).map((s: any) => s.id);
    
    const suppliersData = await db.insert(suppliers).values([]).returning({ id: suppliers.id });
    const supplierIds = (await seedSuppliers()).map((s: any) => s.id);
    
    const costTypeIds = await seedCostTypes();
    
    // Thêm dữ liệu cho các bảng phụ thuộc (có khóa ngoại)
    const billIds = await seedBills(customerIds, serviceIds);
    await seedCosts(billIds, costTypeIds, supplierIds);
    await seedRevenues(billIds);
    await seedPrices(customerIds, serviceIds);
    await seedCostPrices(customerIds, serviceIds, costTypeIds);
    
    // Thêm cài đặt hệ thống
    await seedSettings();
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

main();
