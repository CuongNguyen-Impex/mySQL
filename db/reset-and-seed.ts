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
  // revenues removed - using cost_prices now
  prices,
  costPrices,
  settings
} from "../shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

// Xóa tất cả dữ liệu trước khi thêm mới
async function resetDatabase() {
  try {
    console.log("Xóa tất cả dữ liệu cũ...");
    
    // Xóa dữ liệu từ các bảng có khóa ngoại trước
    // await db.delete(revenues); - revenues table removed
    await db.delete(costs);
    await db.delete(costPrices);
    await db.delete(prices);
    await db.delete(bills);
    await db.delete(costTypeAttributes);
    await db.delete(costTypes);
    await db.delete(suppliers);
    await db.delete(services);
    await db.delete(customers);
    await db.delete(users);
    await db.delete(settings);
    
    console.log("Xóa dữ liệu thành công.");
  } catch (error) {
    console.error("Lỗi khi xóa dữ liệu:", error);
    throw error;
  }
}

async function createAdminUser() {
  try {
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
    console.log("Đã tạo người dùng admin.");
  } catch (error) {
    console.error("Lỗi khi tạo admin:", error);
    throw error;
  }
}

async function seedCustomers() {
  try {
    const customerData = [
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
    
    const insertedCustomers = [];
    for (const customer of customerData) {
      const result = await db.insert(customers).values(customer).returning();
      insertedCustomers.push(result[0]);
    }
    
    console.log("Đã tạo 5 khách hàng.");
    return insertedCustomers;
  } catch (error) {
    console.error("Lỗi khi tạo khách hàng:", error);
    throw error;
  }
}

async function seedServices() {
  try {
    const serviceData = [
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
    
    const insertedServices = [];
    for (const service of serviceData) {
      const result = await db.insert(services).values(service).returning();
      insertedServices.push(result[0]);
    }
    
    console.log("Đã tạo 5 dịch vụ.");
    return insertedServices;
  } catch (error) {
    console.error("Lỗi khi tạo dịch vụ:", error);
    throw error;
  }
}

async function seedSuppliers() {
  try {
    const supplierData = [
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
    
    const insertedSuppliers = [];
    for (const supplier of supplierData) {
      const result = await db.insert(suppliers).values(supplier).returning();
      insertedSuppliers.push(result[0]);
    }
    
    console.log("Đã tạo 5 nhà cung cấp.");
    return insertedSuppliers;
  } catch (error) {
    console.error("Lỗi khi tạo nhà cung cấp:", error);
    throw error;
  }
}

async function seedCostTypes() {
  try {
    const costTypeData = [
      { name: "Phí vận chuyển", description: "Chi phí vận chuyển hàng hóa" },
      { name: "Phí hải quan", description: "Chi phí thủ tục hải quan" },
      { name: "Phí lưu kho", description: "Chi phí lưu trữ hàng hóa" },
      { name: "Phí bốc xếp", description: "Chi phí bốc xếp hàng hóa" },
      { name: "Phí giấy tờ", description: "Chi phí làm giấy tờ, chứng từ" }
    ];
    
    const insertedCostTypes = [];
    for (const costType of costTypeData) {
      const result = await db.insert(costTypes).values(costType).returning();
      insertedCostTypes.push(result[0]);
    }
    
    // Tạo thuộc tính cho mỗi loại chi phí
    const attributeData = [
      // Phí vận chuyển
      { costTypeId: insertedCostTypes[0].id, name: "Quãng đường", description: "Khoảng cách vận chuyển", order: 1 },
      { costTypeId: insertedCostTypes[0].id, name: "Loại xe", description: "Loại phương tiện vận chuyển", order: 2 },
      
      // Phí hải quan
      { costTypeId: insertedCostTypes[1].id, name: "Loại hàng", description: "Loại hàng hóa xuất nhập khẩu", order: 1 },
      { costTypeId: insertedCostTypes[1].id, name: "Cảng", description: "Cảng xuất nhập", order: 2 },
      
      // Phí lưu kho
      { costTypeId: insertedCostTypes[2].id, name: "Thời gian", description: "Thời gian lưu kho", order: 1 },
      { costTypeId: insertedCostTypes[2].id, name: "Loại kho", description: "Loại kho bãi", order: 2 },
      
      // Phí bốc xếp
      { costTypeId: insertedCostTypes[3].id, name: "Khối lượng", description: "Khối lượng hàng hóa", order: 1 },
      { costTypeId: insertedCostTypes[3].id, name: "Thiết bị", description: "Thiết bị bốc xếp", order: 2 },
      
      // Phí giấy tờ
      { costTypeId: insertedCostTypes[4].id, name: "Loại giấy tờ", description: "Loại giấy tờ, chứng từ", order: 1 },
      { costTypeId: insertedCostTypes[4].id, name: "Số lượng", description: "Số lượng bộ chứng từ", order: 2 }
    ];
    
    for (const attribute of attributeData) {
      await db.insert(costTypeAttributes).values(attribute);
    }
    
    console.log("Đã tạo 5 loại chi phí và các thuộc tính.");
    return insertedCostTypes;
  } catch (error) {
    console.error("Lỗi khi tạo loại chi phí:", error);
    throw error;
  }
}

async function seedBills(customers, services) {
  try {
    const billData = [
      {
        billNo: "BILL-001",
        date: new Date("2025-05-01").toISOString(),
        customerId: customers[0].id,
        serviceId: services[0].id,
        importExportType: "Nhập khẩu",
        packageInfo: "10 container 40",
        goodsType: "Nguyên liệu sản xuất",
        invoiceNo: "INV-2025-001",
        status: "Completed"
      },
      {
        billNo: "BILL-002",
        date: new Date("2025-04-15").toISOString(),
        customerId: customers[1].id,
        serviceId: services[1].id,
        importExportType: "Xuất khẩu",
        packageInfo: "5 container 20",
        goodsType: "Hàng tiêu dùng",
        invoiceNo: "INV-2025-002",
        status: "Completed"
      },
      {
        billNo: "BILL-003",
        date: new Date("2025-04-30").toISOString(),
        customerId: customers[2].id,
        serviceId: services[2].id,
        importExportType: "Nội địa",
        packageInfo: "20 pallet",
        goodsType: "Thực phẩm",
        invoiceNo: "INV-2025-003",
        status: "In Progress"
      },
      {
        billNo: "BILL-004",
        date: new Date("2025-05-02").toISOString(),
        customerId: customers[3].id,
        serviceId: services[3].id,
        importExportType: "Nhập khẩu",
        packageInfo: "15 container 40",
        goodsType: "Máy móc",
        invoiceNo: "INV-2025-004",
        status: "Pending"
      },
      {
        billNo: "BILL-005",
        date: new Date("2025-05-03").toISOString(),
        customerId: customers[4].id,
        serviceId: services[4].id,
        importExportType: "Xuất khẩu",
        packageInfo: "8 container 40",
        goodsType: "Nông sản",
        invoiceNo: "INV-2025-005",
        status: "Completed"
      }
    ];
    
    const insertedBills = [];
    for (const bill of billData) {
      const result = await db.insert(bills).values(bill).returning();
      insertedBills.push(result[0]);
    }
    
    console.log("Đã tạo 5 hóa đơn.");
    return insertedBills;
  } catch (error) {
    console.error("Lỗi khi tạo hóa đơn:", error);
    throw error;
  }
}

async function seedCosts(billsData, costTypesData, suppliersData) {
  try {
    const costsData = [
      // Chi phí cho Bill 1
      {
        billId: billsData[0].id,
        costTypeId: costTypesData[0].id, // Phí vận chuyển
        supplierId: suppliersData[0].id,
        amount: "5000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí vận chuyển từ cảng về kho",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      {
        billId: billsData[0].id,
        costTypeId: costTypesData[1].id, // Phí hải quan
        supplierId: suppliersData[2].id,
        amount: "3000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí làm thủ tục hải quan",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      
      // Chi phí cho Bill 2
      {
        billId: billsData[1].id,
        costTypeId: costTypesData[0].id, // Phí vận chuyển
        supplierId: suppliersData[1].id,
        amount: "6000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí vận chuyển từ kho ra cảng",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      {
        billId: billsData[1].id,
        costTypeId: costTypesData[3].id, // Phí bốc xếp
        supplierId: suppliersData[3].id,
        amount: "2000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí bốc xếp hàng hóa",
        tt_hd: "Trả hộ",
        date: new Date().toISOString()
      },
      
      // Chi phí cho Bill 3
      {
        billId: billsData[2].id,
        costTypeId: costTypesData[2].id, // Phí lưu kho
        supplierId: suppliersData[3].id,
        amount: "4000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí lưu kho 30 ngày",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      {
        billId: billsData[2].id,
        costTypeId: costTypesData[3].id, // Phí bốc xếp
        supplierId: suppliersData[3].id,
        amount: "1500000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí bốc xếp hàng vào kho",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      
      // Chi phí cho Bill 4
      {
        billId: billsData[3].id,
        costTypeId: costTypesData[0].id, // Phí vận chuyển
        supplierId: suppliersData[0].id,
        amount: "7000000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí vận chuyển máy móc từ cảng",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      {
        billId: billsData[3].id,
        costTypeId: costTypesData[1].id, // Phí hải quan
        supplierId: suppliersData[2].id,
        amount: "3500000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí thủ tục hải quan máy móc",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      {
        billId: billsData[3].id,
        costTypeId: costTypesData[4].id, // Phí giấy tờ
        supplierId: suppliersData[2].id,
        amount: "1200000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí chứng từ, giấy phép",
        tt_hd: "Trả hộ",
        date: new Date().toISOString()
      },
      
      // Chi phí cho Bill 5
      {
        billId: billsData[4].id,
        costTypeId: costTypesData[0].id, // Phí vận chuyển
        supplierId: suppliersData[1].id,
        amount: "5500000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí vận chuyển nông sản ra cảng",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      {
        billId: billsData[4].id,
        costTypeId: costTypesData[1].id, // Phí hải quan
        supplierId: suppliersData[2].id,
        amount: "2500000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí thủ tục hải quan nông sản",
        tt_hd: "Hóa đơn",
        date: new Date().toISOString()
      },
      {
        billId: billsData[4].id,
        costTypeId: costTypesData[3].id, // Phí bốc xếp
        supplierId: suppliersData[3].id,
        amount: "1800000",
        currency: "VND",
        exchangeRate: "1",
        notes: "Phí bốc xếp hàng lên tàu",
        tt_hd: "Trả hộ",
        date: new Date().toISOString()
      }
    ];
    
    for (const cost of costsData) {
      await db.insert(costs).values(cost);
    }
    
    console.log("Đã tạo các chi phí cho hóa đơn.");
  } catch (error) {
    console.error("Lỗi khi tạo chi phí:", error);
    throw error;
  }
}

// seedRevenues function removed - using cost_prices for revenue calculation

async function seedPrices(customersData, servicesData) {
  try {
    const pricesData = [
      {
        customerId: customersData[0].id,
        serviceId: servicesData[0].id,
        price: "10000000",
        currency: "VND",
        description: "Giá dịch vụ vận chuyển đường biển"
      },
      {
        customerId: customersData[1].id,
        serviceId: servicesData[1].id,
        price: "8000000",
        currency: "VND",
        description: "Giá dịch vụ vận chuyển đường bộ"
      },
      {
        customerId: customersData[2].id,
        serviceId: servicesData[2].id,
        price: "7000000",
        currency: "VND",
        description: "Giá dịch vụ kho bãi"
      },
      {
        customerId: customersData[3].id,
        serviceId: servicesData[3].id,
        price: "12000000",
        currency: "VND",
        description: "Giá dịch vụ giao nhận hàng hóa"
      },
      {
        customerId: customersData[4].id,
        serviceId: servicesData[4].id,
        price: "9000000",
        currency: "VND",
        description: "Giá dịch vụ thông quan hải quan"
      }
    ];
    
    for (const price of pricesData) {
      await db.insert(prices).values(price);
    }
    
    console.log("Đã tạo bảng giá dịch vụ.");
  } catch (error) {
    console.error("Lỗi khi tạo bảng giá:", error);
    throw error;
  }
}

async function seedCostPrices(customersData, servicesData, costTypesData) {
  try {
    const costPricesData = [
      // Giá chi phí cho khách hàng 1, dịch vụ 1
      {
        customerId: customersData[0].id,
        serviceId: servicesData[0].id,
        costTypeId: costTypesData[0].id, // Phí vận chuyển
        price: "7000000",
        currency: "VND",
        description: "Giá vận chuyển đường biển cho KH 1"
      },
      {
        customerId: customersData[0].id,
        serviceId: servicesData[0].id,
        costTypeId: costTypesData[1].id, // Phí hải quan
        price: "4500000",
        currency: "VND",
        description: "Giá thủ tục hải quan cho KH 1"
      },
      
      // Giá chi phí cho khách hàng 2, dịch vụ 2
      {
        customerId: customersData[1].id,
        serviceId: servicesData[1].id,
        costTypeId: costTypesData[0].id, // Phí vận chuyển
        price: "8000000",
        currency: "VND",
        description: "Giá vận chuyển đường bộ cho KH 2"
      },
      
      // Giá chi phí cho khách hàng 3, dịch vụ 3
      {
        customerId: customersData[2].id,
        serviceId: servicesData[2].id,
        costTypeId: costTypesData[2].id, // Phí lưu kho
        price: "5000000",
        currency: "VND",
        description: "Giá lưu kho cho KH 3"
      },
      {
        customerId: customersData[2].id,
        serviceId: servicesData[2].id,
        costTypeId: costTypesData[3].id, // Phí bốc xếp
        price: "2000000",
        currency: "VND",
        description: "Giá bốc xếp cho KH 3"
      },
      
      // Giá chi phí cho khách hàng 4, dịch vụ 4
      {
        customerId: customersData[3].id,
        serviceId: servicesData[3].id,
        costTypeId: costTypesData[0].id, // Phí vận chuyển
        price: "9000000",
        currency: "VND",
        description: "Giá vận chuyển cho KH 4"
      },
      {
        customerId: customersData[3].id,
        serviceId: servicesData[3].id,
        costTypeId: costTypesData[1].id, // Phí hải quan
        price: "4000000",
        currency: "VND",
        description: "Giá thủ tục hải quan cho KH 4"
      },
      
      // Giá chi phí cho khách hàng 5, dịch vụ 5
      {
        customerId: customersData[4].id,
        serviceId: servicesData[4].id,
        costTypeId: costTypesData[0].id, // Phí vận chuyển
        price: "7500000",
        currency: "VND",
        description: "Giá vận chuyển cho KH 5"
      },
      {
        customerId: customersData[4].id,
        serviceId: servicesData[4].id,
        costTypeId: costTypesData[1].id, // Phí hải quan
        price: "3500000",
        currency: "VND",
        description: "Giá thủ tục hải quan cho KH 5"
      },
      {
        customerId: customersData[4].id,
        serviceId: servicesData[4].id,
        costTypeId: costTypesData[3].id, // Phí bốc xếp
        price: "2500000",
        currency: "VND",
        description: "Giá bốc xếp cho KH 5"
      }
    ];
    
    for (const costPrice of costPricesData) {
      await db.insert(costPrices).values(costPrice);
    }
    
    console.log("Đã tạo bảng giá theo loại chi phí.");
  } catch (error) {
    console.error("Lỗi khi tạo bảng giá theo loại chi phí:", error);
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
    
    console.log("Đã tạo cài đặt hệ thống.");
  } catch (error) {
    console.error("Lỗi khi tạo cài đặt:", error);
    throw error;
  }
}

async function main() {
  try {
    // Xóa toàn bộ dữ liệu hiện có
    await resetDatabase();
    
    // Thêm dữ liệu mới
    await createAdminUser();
    
    // Thêm dữ liệu cho các bảng chính
    const customers = await seedCustomers();
    const services = await seedServices();
    const suppliers = await seedSuppliers();
    const costTypes = await seedCostTypes();
    
    // Thêm dữ liệu cho các bảng phụ thuộc (có khóa ngoại)
    const bills = await seedBills(customers, services);
    await seedCosts(bills, costTypes, suppliers);
    // seedRevenues removed - using cost_prices for revenue calculation
    await seedPrices(customers, services);
    await seedCostPrices(customers, services, costTypes);
    
    // Thêm cài đặt hệ thống
    await seedSettings();
    
    console.log("Đã tạo dữ liệu mẫu thành công!");
  } catch (error) {
    console.error("Lỗi khi tạo dữ liệu mẫu:", error);
  } finally {
    process.exit(0);
  }
}

main();
