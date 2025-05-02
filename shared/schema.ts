import { pgTable, text, serial, integer, timestamp, date, decimal, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  // Quyền hạn chi tiết
  canManageCategories: boolean("can_manage_categories").default(false).notNull(),
  canEditBills: boolean("can_edit_bills").default(false).notNull(),
  canCreateBills: boolean("can_create_bills").default(false).notNull(),
  canViewRevenueAndPricing: boolean("can_view_revenue_pricing").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  role: (schema) => schema.refine(val => ["admin", "user"].includes(val), "Role must be either 'admin' or 'user'")
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
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCustomerSchema = createInsertSchema(customers, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Invalid email address").optional().nullable()
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertServiceSchema = createInsertSchema(services, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters")
});
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Invalid email address").optional().nullable()
});
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Cost Types table
export const costTypes = pgTable("cost_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Cost Type Attributes table
export const costTypeAttributes = pgTable("cost_type_attributes", {
  id: serial("id").primaryKey(),
  costTypeId: integer("cost_type_id").references(() => costTypes.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCostTypeAttributeSchema = createInsertSchema(costTypeAttributes, {
  name: (schema) => schema.min(1, "Attribute name is required")
});
export type InsertCostTypeAttribute = z.infer<typeof insertCostTypeAttributeSchema>;
export type CostTypeAttribute = typeof costTypeAttributes.$inferSelect;

// Cost Attributes Values table - stores the selected attribute for each cost
export const costAttributeValues = pgTable("cost_attribute_values", {
  id: serial("id").primaryKey(),
  costId: integer("cost_id").references(() => costs.id, { onDelete: 'cascade' }).notNull(),
  attributeId: integer("attribute_id").references(() => costTypeAttributes.id, { onDelete: 'cascade' }).notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCostAttributeValueSchema = createInsertSchema(costAttributeValues);
export type InsertCostAttributeValue = z.infer<typeof insertCostAttributeValueSchema>;
export type CostAttributeValue = typeof costAttributeValues.$inferSelect;

export const insertCostTypeSchema = createInsertSchema(costTypes, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters")
});
export type InsertCostType = z.infer<typeof insertCostTypeSchema>;
export type CostType = typeof costTypes.$inferSelect;

// Bills table
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNo: text("bill_no").notNull(),
  date: date("date").notNull(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  serviceId: integer("service_id").references(() => services.id, { onDelete: 'cascade' }).notNull(),
  status: text("status").notNull().default("Pending"),
  invoiceNo: text("invoice_no"),
  importExportType: text("import_export_type").notNull().default("Nhập"),
  packageCount: integer("package_count"),
  goodsType: text("goods_type").notNull().default("Air"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertBillSchema = createInsertSchema(bills, {
  billNo: (schema) => schema.min(1, "Bill number is required"),
  status: (schema) => schema.refine(
    val => ["Pending", "In Progress", "Completed", "Cancelled"].includes(val),
    "Status must be one of: Pending, In Progress, Completed, Cancelled"
  ),
  importExportType: (schema) => schema.refine(
    val => ["Nhập", "Xuất"].includes(val),
    "Type must be either Nhập or Xuất"
  ),
  goodsType: (schema) => schema.refine(
    val => ["Air", "Sea", "LCL", "Dom"].includes(val),
    "Goods type must be one of: Air, Sea, LCL, Dom"
  )
});
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;

// Costs table
export const costs = pgTable("costs", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").references(() => bills.id, { onDelete: 'cascade' }).notNull(),
  costTypeId: integer("cost_type_id").references(() => costTypes.id, { onDelete: 'cascade' }).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  tt_hd: text("tt_hd").default("Hóa đơn").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCostSchema = createInsertSchema(costs, {
  amount: (schema) => schema.refine(val => parseFloat(val) > 0, "Amount must be greater than 0"),
  tt_hd: (schema) => schema.refine(
    val => val === "Hóa đơn" || val === "Trả hộ", 
    "TT_HD must be either 'Hóa đơn' or 'Trả hộ'"
  )
});
export type InsertCost = z.infer<typeof insertCostSchema>;
export type Cost = typeof costs.$inferSelect;

// Prices table (for service pricing by customer)
export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  serviceId: integer("service_id").references(() => services.id, { onDelete: 'cascade' }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertPriceSchema = createInsertSchema(prices, {
  price: (schema) => schema.refine(val => parseFloat(val) > 0, "Price must be greater than 0")
});
export type InsertPrice = z.infer<typeof insertPriceSchema>;
export type Price = typeof prices.$inferSelect;

// Revenue table
export const revenues = pgTable("revenues", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").references(() => bills.id, { onDelete: 'cascade' }).notNull(),
  serviceId: integer("service_id").references(() => services.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertRevenueSchema = createInsertSchema(revenues, {
  amount: (schema) => schema.refine(val => parseFloat(val) > 0, "Amount must be greater than 0")
});
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;
export type Revenue = typeof revenues.$inferSelect;

// Google Sheets Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
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
  costs: many(costs),
  revenues: many(revenues)
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

export const revenuesRelations = relations(revenues, ({ one }) => ({
  bill: one(bills, {
    fields: [revenues.billId],
    references: [bills.id]
  }),
  service: one(services, {
    fields: [revenues.serviceId],
    references: [services.id]
  })
}));

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

export const customersRelations = relations(customers, ({ many }) => ({
  bills: many(bills),
  prices: many(prices)
}));

export const servicesRelations = relations(services, ({ many }) => ({
  bills: many(bills),
  revenues: many(revenues),
  prices: many(prices)
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  costs: many(costs)
}));

export const costTypesRelations = relations(costTypes, ({ many }) => ({
  costs: many(costs),
  attributes: many(costTypeAttributes)
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
