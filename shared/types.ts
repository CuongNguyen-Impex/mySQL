import { z } from "zod";
import {
  Bill,
  Cost,
  CostType,
  CostTypeAttribute,
  CostAttributeValue,
  Customer,
  Revenue,
  Service,
  Supplier,
  Price,
  CostPrice,
  User,
  Setting,
  insertBillSchema,
  insertCostSchema,
  insertCostTypeSchema,
  insertCostTypeAttributeSchema,
  insertCostAttributeValueSchema,
  insertCustomerSchema,
  insertRevenueSchema,
  insertServiceSchema,
  insertSupplierSchema,
  insertPriceSchema,
  insertCostPriceSchema,
  insertUserSchema,
  insertSettingSchema
} from "./schema";

// Export DB types
export type {
  Bill,
  Cost,
  CostType,
  CostTypeAttribute,
  CostAttributeValue,
  Customer,
  Revenue,
  Service,
  Supplier,
  Price,
  CostPrice,
  User,
  Setting
};

// Form schemas with additional validation for frontend
export const billFormSchema = insertBillSchema.extend({
  date: z.coerce.date(),
  customerId: z.coerce.number(),
  serviceId: z.coerce.number(),
  packageCount: z.coerce.number().optional(),
  importExportType: z.enum(["Nhập", "Xuất"]),
  goodsType: z.enum(["Air", "Sea", "LCL", "Dom"]),
  invoiceNo: z.string().optional()
});

export const costFormSchema = insertCostSchema.extend({
  date: z.coerce.date(),
  billId: z.coerce.number(),
  costTypeId: z.coerce.number(),
  supplierId: z.coerce.number(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  tt_hd: z.enum(["Hóa đơn", "Trả hộ"])
});

export const revenueFormSchema = insertRevenueSchema.extend({
  date: z.coerce.date(),
  billId: z.coerce.number(),
  serviceId: z.coerce.number(),
  amount: z.coerce.number().positive("Amount must be greater than 0")
});

// PriceForm schema for multi-price form
const priceItemSchema = z.object({
  serviceId: z.coerce.number(),
  price: z.string().min(1, "Price is required")
});

export const priceFormSchema = z.object({
  customerId: z.coerce.number(),
  prices: z.array(priceItemSchema).min(1, "At least one price is required")
});

// Original price item schema for single-item operations
export const priceItemFormSchema = insertPriceSchema.extend({
  customerId: z.coerce.number(),
  serviceId: z.coerce.number(),
  price: z.string().min(1, "Price is required")
});

// Cost Price item schema
export const costPriceItemFormSchema = insertCostPriceSchema.extend({
  customerId: z.coerce.number(),
  serviceId: z.coerce.number(),
  costTypeId: z.coerce.number(),
  price: z.string().min(1, "Price is required")
});

// Cost price form schema for multi-price form
const costPriceItemSchema = z.object({
  costTypeId: z.coerce.number(),
  price: z.string().min(1, "Price is required")
});

export const costPriceFormSchema = z.object({
  customerId: z.coerce.number(),
  serviceId: z.coerce.number(),
  prices: z.array(costPriceItemSchema).min(1, "At least one price is required")
});

export const customerFormSchema = insertCustomerSchema;
export const serviceFormSchema = insertServiceSchema;
export const costTypeFormSchema = insertCostTypeSchema;
export const costTypeAttributeFormSchema = insertCostTypeAttributeSchema.extend({
  costTypeId: z.coerce.number()
});
export const costAttributeValueFormSchema = insertCostAttributeValueSchema.extend({
  costId: z.coerce.number(),
  costTypeAttributeId: z.coerce.number()
});
export const supplierFormSchema = insertSupplierSchema;
export const userFormSchema = insertUserSchema;
export const settingFormSchema = insertSettingSchema;

// Extended types for frontend use with relations
export interface BillWithRelations extends Bill {
  customer?: Customer;
  service?: Service;
  costs?: Cost[];
  revenues?: Revenue[];
  totalCost?: number;
  totalRevenue?: number;
  profit?: number;
}

export interface CostWithRelations extends Cost {
  bill?: Bill;
  costType?: CostType;
  supplier?: Supplier;
  attributeValues?: CostAttributeValueWithRelations[];
}

export interface CostTypeAttributeWithRelations extends CostTypeAttribute {
  costType?: CostType;
}

export interface CostAttributeValueWithRelations extends CostAttributeValue {
  attribute?: CostTypeAttribute;
  cost?: Cost;
}

export interface RevenueWithRelations extends Revenue {
  bill?: Bill;
  service?: Service;
}

export interface PriceWithRelations extends Price {
  customer?: Customer;
  service?: Service;
}

export interface CostPriceWithRelations extends CostPrice {
  customer?: Customer;
  service?: Service;
  costType?: CostType;
}

// Dashboard types
export interface DashboardSummary {
  totalBills: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  billsTrend: number;
  revenueTrend: number;
  costsTrend: number;
  profitTrend: number;
  customerPerformance: {
    name: string;
    id: number;
    revenue: number;
    costs: number;
    profit: number;
    percentage: number;
  }[];
  servicePerformance: {
    name: string;
    id: number;
    revenue: number;
    costs: number;
    profit: number;
    percentage: number;
  }[];
}

// Report types
export interface CustomerReport {
  customers: {
    id: number;
    name: string;
    billCount: number;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
  }[];
}

export interface SupplierReport {
  suppliers: {
    id: number;
    name: string;
    costTypeNames: string[];
    transactionCount: number;
    totalAmount: number;
    averageCost: number;
    percentage: number;
  }[];
}

export interface ProfitLossReport {
  summary: {
    totalRevenue: number;
    hoaDonCosts: number;
    traHoCosts: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    billCount: number;
  };
  periods: {
    label: string;
    billCount: number;
    revenue: number;
    hoaDonCosts: number;
    traHoCosts: number;
    totalCosts: number;
    profit: number;
    margin: number;
  }[];
}

// Google Sheets settings
export interface GoogleSheetsSettings {
  spreadsheetId: string;
  autoSync: boolean;
  connected: boolean;
  lastSynced: string | null;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    role: string;
  };
}
