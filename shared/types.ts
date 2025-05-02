import { z } from "zod";
import {
  Bill,
  Cost,
  CostType,
  Customer,
  Revenue,
  Service,
  Supplier,
  Price,
  User,
  Setting,
  insertBillSchema,
  insertCostSchema,
  insertCostTypeSchema,
  insertCustomerSchema,
  insertRevenueSchema,
  insertServiceSchema,
  insertSupplierSchema,
  insertPriceSchema,
  insertUserSchema,
  insertSettingSchema
} from "./schema";

// Export DB types
export type {
  Bill,
  Cost,
  CostType,
  Customer,
  Revenue,
  Service,
  Supplier,
  Price,
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
  amount: z.coerce.number().positive("Amount must be greater than 0")
});

export const revenueFormSchema = insertRevenueSchema.extend({
  date: z.coerce.date(),
  billId: z.coerce.number(),
  serviceId: z.coerce.number(),
  amount: z.coerce.number().positive("Amount must be greater than 0")
});

export const priceFormSchema = insertPriceSchema.extend({
  customerId: z.coerce.number(),
  serviceId: z.coerce.number(),
  price: z.coerce.number().positive("Price must be greater than 0")
});

export const customerFormSchema = insertCustomerSchema;
export const serviceFormSchema = insertServiceSchema;
export const costTypeFormSchema = insertCostTypeSchema;
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
}

export interface RevenueWithRelations extends Revenue {
  bill?: Bill;
  service?: Service;
}

export interface PriceWithRelations extends Price {
  customer?: Customer;
  service?: Service;
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
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    billCount: number;
  };
  periods: {
    label: string;
    billCount: number;
    revenue: number;
    costs: number;
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
