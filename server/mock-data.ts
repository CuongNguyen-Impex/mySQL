// Tạo dữ liệu mẫu cho môi trường Replit (khi không thể kết nối đến MySQL)

// Tài khoản admin mặc định
export const adminUser = {
  id: 1,
  username: "admin",
  role: "admin",
  canManageCategories: true,
  canEditBills: true,
  canCreateBills: true,
  canViewRevenueAndPricing: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Dữ liệu mẫu cho dịch vụ
export const sampleServices = [
  {
    id: 1,
    name: "Vận chuyển container",
    description: "Dịch vụ vận chuyển container",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Vận chuyển hàng lẻ",
    description: "Dịch vụ vận chuyển hàng lẻ",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Dữ liệu mẫu cho khách hàng
export const sampleCustomers = [
  {
    id: 1,
    name: "Công ty ABC",
    contactName: "Nguyễn Văn A",
    phone: "0123456789",
    email: "abc@example.com",
    address: "Hà Nội",
    taxCode: "0123456789",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Công ty XYZ",
    contactName: "Trần Thị B",
    phone: "0987654321",
    email: "xyz@example.com",
    address: "Hồ Chí Minh",
    taxCode: "9876543210",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Dữ liệu mẫu cho nhà cung cấp
export const sampleSuppliers = [
  {
    id: 1,
    name: "Nhà cung cấp 1",
    contactName: "Nguyễn Thị C",
    phone: "0123456789",
    email: "supplier1@example.com",
    address: "Hà Nội",
    taxCode: "1234567890",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Nhà cung cấp 2",
    contactName: "Lê Văn D",
    phone: "0987654321",
    email: "supplier2@example.com",
    address: "Hồ Chí Minh",
    taxCode: "0987654321",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Dữ liệu mẫu cho loại chi phí
export const sampleCostTypes = [
  {
    id: 1,
    name: "Chi phí vận chuyển",
    description: "Chi phí vận chuyển hàng hóa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Chi phí giao hàng",
    description: "Chi phí giao hàng tận nơi",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Dữ liệu mẫu cho hóa đơn
export const sampleBills = [
  {
    id: 1,
    customerId: 1,
    serviceId: 1,
    billCode: "BILL001",
    containerCode: "CONT001",
    deliveryCode: "DEL001",
    exportType: "Xuất khẩu",
    packagingType: "Container 40",
    importExportLocation: "Cảng Hải Phòng",
    status: "Completed",
    description: "Hóa đơn vận chuyển hàng hóa",
    goodsDescription: "Hàng may mặc",
    goodsQuantity: 1000,
    goodsWeight: 5000,
    measurementUnit: "kg",
    dateOfAcceptance: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    customerId: 2,
    serviceId: 2,
    billCode: "BILL002",
    containerCode: "CONT002",
    deliveryCode: "DEL002",
    exportType: "Nhập khẩu",
    packagingType: "Container 20",
    importExportLocation: "Cảng Đà Nẵng",
    status: "In Progress",
    description: "Hóa đơn vận chuyển hàng hóa",
    goodsDescription: "Hàng điện tử",
    goodsQuantity: 500,
    goodsWeight: 2500,
    measurementUnit: "kg",
    dateOfAcceptance: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Dữ liệu mẫu cho chi phí
export const sampleCosts = [
  {
    id: 1,
    billId: 1,
    costTypeId: 1,
    supplierId: 1,
    amount: 5000000,
    ttHd: "Hóa đơn",
    description: "Chi phí vận chuyển",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    billId: 1,
    costTypeId: 2,
    supplierId: 2,
    amount: 2000000,
    ttHd: "Trả hộ",
    description: "Chi phí giao hàng",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Dữ liệu mẫu cho bảng giá
export const samplePrices = [
  {
    id: 1,
    customerId: 1,
    serviceId: 1,
    price: 7000000,
    description: "Giá vận chuyển container",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    customerId: 2,
    serviceId: 2,
    price: 3000000,
    description: "Giá vận chuyển hàng lẻ",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Dữ liệu mẫu cho bảng giá chi phí
export const sampleCostPrices = [
  {
    id: 1,
    customerId: 1,
    serviceId: 1,
    costTypeId: 1,
    price: 6000000,
    description: "Giá chi phí vận chuyển container",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    customerId: 2,
    serviceId: 2,
    costTypeId: 2,
    price: 2500000,
    description: "Giá chi phí giao hàng hàng lẻ",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
