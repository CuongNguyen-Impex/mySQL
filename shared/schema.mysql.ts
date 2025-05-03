import { mysqlTable, varchar, int, timestamp, date, decimal, boolean, primaryKey, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  // Quyền hạn chi tiết
  canManageCategories: boolean("can_manage_categories").default(false).notNull(),
  canEditBills: boolean("can_edit_bills").default(false).notNull(),
  canCreateBills: boolean("can_create_bills").default(false).notNull(),
  canViewRevenueAndPricing: boolean("can_view_revenue_pricing").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users, {
  username: (schema: any) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema: any) => schema.min(6, "Password must be at least 6 characters"),
  role: (schema: any) => schema.refine((val: any) => ["admin", "user"].includes(val), "Role must be either 'admin' or 'user'")
});

export const updateUserPermissionsSchema = z.object({
  canManageCategories: z.boolean().default(false),
  canEditBills: z.boolean().default(false),
  canCreateBills: z.boolean().default(false),
  canViewRevenueAndPricing: z.boolean().default(false),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Customers table
export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: varchar("address", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCustomerSchema = createInsertSchema(customers, {
  name: (schema: any) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema: any) => schema.email("Invalid email address").optional().nullable()
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Services table
export const services = mysqlTable("services", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertServiceSchema = createInsertSchema(services, {
  name: (schema: any) => schema.min(2, "Name must be at least 2 characters")
});
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Suppliers table
export const suppliers = mysqlTable("suppliers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: varchar("address", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: (schema: any) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema: any) => schema.email("Invalid email address").optional().nullable()
});
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Cost Types table
export const costTypes = mysqlTable("cost_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Cost Type Attributes table
export const costTypeAttributes = mysqlTable("cost_type_attributes", {
  id: int("id").primaryKey().autoincrement(),
  costTypeId: int("cost_type_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCostTypeAttributeSchema = createInsertSchema(costTypeAttributes, {
  name: (schema: any) => schema.min(1, "Attribute name is required")
});
export type InsertCostTypeAttribute = z.infer<typeof insertCostTypeAttributeSchema>;
export type CostTypeAttribute = typeof costTypeAttributes.$inferSelect;

// Define costs table first without references (we'll add them later)
export const costs = mysqlTable("costs", {
  id: int("id").primaryKey().autoincrement(),
  billId: int("bill_id").notNull(),
  costTypeId: int("cost_type_id").notNull(),
  supplierId: int("supplier_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: varchar("notes", { length: 500 }),
  tt_hd: varchar("tt_hd", { length: 50 }).default("Hóa đơn").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Cost Attributes Values table - stores the selected attribute for each cost
export const costAttributeValues = mysqlTable("cost_attribute_values", {
  id: int("id").primaryKey().autoincrement(),
  costId: int("cost_id").notNull(),
  attributeId: int("attribute_id").notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCostAttributeValueSchema = createInsertSchema(costAttributeValues);
export type InsertCostAttributeValue = z.infer<typeof insertCostAttributeValueSchema>;
export type CostAttributeValue = typeof costAttributeValues.$inferSelect;

export const insertCostTypeSchema = createInsertSchema(costTypes, {
  name: (schema: any) => schema.min(2, "Name must be at least 2 characters")
});
export type InsertCostType = z.infer<typeof insertCostTypeSchema>;
export type CostType = typeof costTypes.$inferSelect;

// Bills table
export const bills = mysqlTable("bills", {
  id: int("id").primaryKey().autoincrement(),
  billNo: varchar("bill_no", { length: 100 }).notNull(),
  date: date("date").notNull(),
  customerId: int("customer_id").notNull(),
  serviceId: int("service_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  invoiceNo: varchar("invoice_no", { length: 100 }),
  importExportType: varchar("import_export_type", { length: 50 }).notNull().default("Nhập"),
  packageCount: int("package_count"),
  goodsType: varchar("goods_type", { length: 50 }).notNull().default("Air"),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertBillSchema = createInsertSchema(bills, {
  billNo: (schema: any) => schema.min(1, "Bill number is required"),
  status: (schema: any) => schema.refine(
    (val: any) => ["Pending", "In Progress", "Completed", "Cancelled"].includes(val),
    "Status must be one of: Pending, In Progress, Completed, Cancelled"
  ),
  importExportType: (schema: any) => schema.refine(
    (val: any) => ["Nhập", "Xuất"].includes(val),
    "Type must be either Nhập or Xuất"
  ),
  goodsType: (schema: any) => schema.refine(
    (val: any) => ["Air", "Sea", "LCL", "Dom"].includes(val),
    "Goods type must be one of: Air, Sea, LCL, Dom"
  )
});
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;

export const insertCostSchema = createInsertSchema(costs, {
  amount: (schema: any) => schema.refine((val: any) => parseFloat(val) > 0, "Amount must be greater than 0"),
  tt_hd: (schema: any) => schema.refine(
    (val: any) => val === "Hóa đơn" || val === "Trả hộ", 
    "TT_HD must be either 'Hóa đơn' or 'Trả hộ'"
  )
});
export type InsertCost = z.infer<typeof insertCostSchema>;
export type Cost = typeof costs.$inferSelect;

// Prices table (for service pricing by customer)
export const prices = mysqlTable("prices", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id").notNull(),
  serviceId: int("service_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Cost Prices table (for cost-specific pricing by customer and service)
export const costPrices = mysqlTable("cost_prices", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id").notNull(),
  serviceId: int("service_id").notNull(),
  costTypeId: int("cost_type_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertPriceSchema = createInsertSchema(prices, {
  price: (schema: any) => schema.refine((val: any) => parseFloat(val) > 0, "Price must be greater than 0")
});
export type InsertPrice = z.infer<typeof insertPriceSchema>;
export type Price = typeof prices.$inferSelect;

export const insertCostPriceSchema = createInsertSchema(costPrices, {
  price: (schema: any) => schema.refine((val: any) => parseFloat(val) > 0, "Price must be greater than 0")
});
export type InsertCostPrice = z.infer<typeof insertCostPriceSchema>;
export type CostPrice = typeof costPrices.$inferSelect;

// Revenue table
// Bảng revenues đã bị xóa - Hiện doanh thu được tính từ bảng cost_prices

// Google Sheets Settings
export const settings = mysqlTable("settings", {
  id: int("id").primaryKey().autoincrement(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: varchar("value", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSettingSchema = createInsertSchema(settings);
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Relations
export const billsRelations = relations(bills, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id]
  }),
  service: one(services, {
    fields: [bills.serviceId],
    references: [services.id]
  }),
  costs: many(costs)
  // Revenues relation removed - using cost_prices now for revenue calculation
}));

export const costsRelations = relations(costs, ({ one, many }) => ({
  bill: one(bills, {
    fields: [costs.billId],
    references: [bills.id]
  }),
  costType: one(costTypes, {
    fields: [costs.costTypeId],
    references: [costTypes.id]
  }),
  supplier: one(suppliers, {
    fields: [costs.supplierId],
    references: [suppliers.id]
  }),
  attributeValues: many(costAttributeValues)
}));

// Revenues relations removed - using cost_prices now

export const pricesRelations = relations(prices, ({ one }) => ({
  customer: one(customers, {
    fields: [prices.customerId],
    references: [customers.id]
  }),
  service: one(services, {
    fields: [prices.serviceId],
    references: [services.id]
  })
}));

export const costPricesRelations = relations(costPrices, ({ one }) => ({
  customer: one(customers, {
    fields: [costPrices.customerId],
    references: [customers.id]
  }),
  service: one(services, {
    fields: [costPrices.serviceId],
    references: [services.id]
  }),
  costType: one(costTypes, {
    fields: [costPrices.costTypeId],
    references: [costTypes.id]
  })
}));

export const customersRelations = relations(customers, ({ many }) => ({
  bills: many(bills),
  prices: many(prices),
  costPrices: many(costPrices)
}));

export const servicesRelations = relations(services, ({ many }) => ({
  bills: many(bills),
  // revenues relation removed - using cost_prices now
  prices: many(prices),
  costPrices: many(costPrices)
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  costs: many(costs)
}));

export const costTypesRelations = relations(costTypes, ({ many }) => ({
  costs: many(costs),
  attributes: many(costTypeAttributes),
  costPrices: many(costPrices)
}));

export const costTypeAttributesRelations = relations(costTypeAttributes, ({ one, many }) => ({
  costType: one(costTypes, {
    fields: [costTypeAttributes.costTypeId],
    references: [costTypes.id]
  }),
  attributeValues: many(costAttributeValues)
}));

export const costAttributeValuesRelations = relations(costAttributeValues, ({ one }) => ({
  cost: one(costs, {
    fields: [costAttributeValues.costId],
    references: [costs.id]
  }),
  attribute: one(costTypeAttributes, {
    fields: [costAttributeValues.attributeId],
    references: [costTypeAttributes.id]
  })
}));
