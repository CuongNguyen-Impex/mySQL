import { db } from "./index";
import * as schema from "../shared/schema.js";

const { customers, services, suppliers, costTypes, bills, costs, revenues, prices } = schema;

async function seed() {
  try {
    console.log("Starting seed process...");
    
    // Check if data already exists in any table
    const customerCount = await db.select().from(customers).execute();
    const serviceCount = await db.select().from(services).execute();
    const supplierCount = await db.select().from(suppliers).execute();

    if (customerCount.length > 0 || serviceCount.length > 0 || supplierCount.length > 0) {
      console.log("Data already exists. Skipping seed process.");
      return;
    }

    // 1. Seed Customers
    console.log("Seeding customers...");
    const customersData = [
      {
        name: "Công ty TNHH Thương mại ABC",
        contactPerson: "Nguyễn Văn An",
        email: "vanan@abccompany.com",
        phone: "0901234567",
        address: "123 Lê Lợi, Quận 1, TPHCM"
      },
      {
        name: "Công ty CP Vận tải XYZ",
        contactPerson: "Trần Thị Bình",
        email: "binh.tran@xyztransport.com",
        phone: "0912345678",
        address: "456 Nguyễn Huệ, Quận 1, TPHCM"
      },
      {
        name: "Công ty XNK Hiệp Phát",
        contactPerson: "Lê Văn Cường",
        email: "cuonglv@hiepphat.vn",
        phone: "0923456789",
        address: "789 Trần Hưng Đạo, Quận 5, TPHCM"
      }
    ];
    
    const insertedCustomers = await db.insert(customers).values(customersData).returning();
    console.log(`Inserted ${insertedCustomers.length} customers`);

    // 2. Seed Services
    console.log("Seeding services...");
    const servicesData = [
      {
        name: "Vận chuyển đường bộ",
        description: "Dịch vụ vận chuyển hàng hóa bằng đường bộ nội địa"
      },
      {
        name: "Vận chuyển đường biển",
        description: "Dịch vụ vận chuyển hàng hóa bằng container đường biển quốc tế"
      },
      {
        name: "Dịch vụ kho bãi",
        description: "Dịch vụ lưu kho và quản lý hàng hóa"
      }
    ];
    
    const insertedServices = await db.insert(services).values(servicesData).returning();
    console.log(`Inserted ${insertedServices.length} services`);

    // 3. Seed Suppliers
    console.log("Seeding suppliers...");
    const suppliersData = [
      {
        name: "Công ty Vận tải Đông Nam",
        contactPerson: "Phạm Văn Dũng",
        email: "dungpv@dongnam.com",
        phone: "0934567890",
        address: "147 Điện Biên Phủ, Quận 3, TPHCM"
      },
      {
        name: "Hãng tàu Sao Biển",
        contactPerson: "Hoàng Thị Em",
        email: "emhoang@saobien.vn",
        phone: "0945678901",
        address: "258 Nguyễn Tất Thành, Quận 4, TPHCM"
      },
      {
        name: "Kho vận Thành Công",
        contactPerson: "Tô Văn Phúc",
        email: "phuctv@thanhcong.com",
        phone: "0956789012",
        address: "369 Võ Văn Kiệt, Quận 1, TPHCM"
      }
    ];
    
    const insertedSuppliers = await db.insert(suppliers).values(suppliersData).returning();
    console.log(`Inserted ${insertedSuppliers.length} suppliers`);

    // 4. Seed Cost Types
    console.log("Seeding cost types...");
    const costTypesData = [
      {
        name: "Cước vận chuyển",
        description: "Chi phí cước vận chuyển cho nhà cung cấp dịch vụ"
      },
      {
        name: "Phí lưu kho",
        description: "Chi phí lưu kho hàng hóa"
      },
      {
        name: "Phí xếp dỡ",
        description: "Chi phí xếp dỡ hàng hóa"
      }
    ];
    
    const insertedCostTypes = await db.insert(costTypes).values(costTypesData).returning();
    console.log(`Inserted ${insertedCostTypes.length} cost types`);

    // 5. Seed Prices
    console.log("Seeding prices...");
    const pricesData = [
      {
        customerId: insertedCustomers[0].id,
        serviceId: insertedServices[0].id,
        price: "5000000"
      },
      {
        customerId: insertedCustomers[0].id,
        serviceId: insertedServices[1].id,
        price: "15000000"
      },
      {
        customerId: insertedCustomers[1].id,
        serviceId: insertedServices[0].id,
        price: "4800000"
      },
      {
        customerId: insertedCustomers[1].id,
        serviceId: insertedServices[2].id,
        price: "3500000"
      },
      {
        customerId: insertedCustomers[2].id,
        serviceId: insertedServices[1].id,
        price: "16000000"
      },
      {
        customerId: insertedCustomers[2].id,
        serviceId: insertedServices[2].id,
        price: "3200000"
      }
    ];
    
    const insertedPrices = await db.insert(prices).values(pricesData).returning();
    console.log(`Inserted ${insertedPrices.length} prices`);

    // 6. Seed Bills
    console.log("Seeding bills...");
    const currentDate = new Date();
    const oneMonthAgo = new Date(currentDate);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(currentDate);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const billsData = [
      {
        billNo: "BILL-001",
        date: currentDate.toISOString().split('T')[0],
        customerId: insertedCustomers[0].id,
        serviceId: insertedServices[0].id,
        status: "Completed",
        notes: "Vận chuyển 20 tấn hàng hóa từ TPHCM đến Hà Nội"
      },
      {
        billNo: "BILL-002",
        date: oneMonthAgo.toISOString().split('T')[0],
        customerId: insertedCustomers[1].id,
        serviceId: insertedServices[1].id,
        status: "In Progress",
        notes: "Vận chuyển 2 container 40 feet từ Hải Phòng đến Singapore"
      },
      {
        billNo: "BILL-003",
        date: twoMonthsAgo.toISOString().split('T')[0],
        customerId: insertedCustomers[2].id,
        serviceId: insertedServices[2].id,
        status: "Pending",
        notes: "Lưu kho 500 thùng hàng trong 30 ngày"
      }
    ];
    
    const insertedBills = await db.insert(bills).values(billsData).returning();
    console.log(`Inserted ${insertedBills.length} bills`);

    // 7. Seed Costs
    console.log("Seeding costs...");
    const costsData = [
      {
        billId: insertedBills[0].id,
        costTypeId: insertedCostTypes[0].id,
        supplierId: insertedSuppliers[0].id,
        amount: "3500000",
        date: currentDate.toISOString().split('T')[0],
        notes: "Chi phí vận chuyển đường bộ"
      },
      {
        billId: insertedBills[1].id,
        costTypeId: insertedCostTypes[0].id,
        supplierId: insertedSuppliers[1].id,
        amount: "12000000",
        date: oneMonthAgo.toISOString().split('T')[0],
        notes: "Chi phí vận chuyển đường biển"
      },
      {
        billId: insertedBills[2].id,
        costTypeId: insertedCostTypes[1].id,
        supplierId: insertedSuppliers[2].id,
        amount: "2500000",
        date: twoMonthsAgo.toISOString().split('T')[0],
        notes: "Chi phí lưu kho 30 ngày"
      }
    ];
    
    const insertedCosts = await db.insert(costs).values(costsData).returning();
    console.log(`Inserted ${insertedCosts.length} costs`);

    // 8. Seed Revenues
    console.log("Seeding revenues...");
    const revenuesData = [
      {
        billId: insertedBills[0].id,
        serviceId: insertedServices[0].id,
        amount: "5000000",
        date: currentDate.toISOString().split('T')[0],
        notes: "Doanh thu vận chuyển đường bộ"
      },
      {
        billId: insertedBills[1].id,
        serviceId: insertedServices[1].id,
        amount: "15000000",
        date: oneMonthAgo.toISOString().split('T')[0],
        notes: "Doanh thu vận chuyển đường biển"
      },
      {
        billId: insertedBills[2].id,
        serviceId: insertedServices[2].id,
        amount: "3200000",
        date: twoMonthsAgo.toISOString().split('T')[0],
        notes: "Doanh thu dịch vụ lưu kho"
      }
    ];
    
    const insertedRevenues = await db.insert(revenues).values(revenuesData).returning();
    console.log(`Inserted ${insertedRevenues.length} revenues`);

    console.log("Seed process completed successfully!");
  } catch (error) {
    console.error("Error during seed process:", error);
  }
}

seed();
