import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, optionalAuthMiddleware } from "./middleware/auth.middleware";

// Controllers
import * as authController from "./controllers/auth.controller";
import * as billController from "./controllers/bill.controller";
import * as costController from "./controllers/cost.controller";
import * as revenueController from "./controllers/revenue.controller";
import * as customerController from "./controllers/customer.controller";
import * as supplierController from "./controllers/supplier.controller";
import * as serviceController from "./controllers/service.controller";
import * as costTypeController from "./controllers/cost-type.controller";
import * as costTypeAttributeController from "./controllers/cost-type-attribute.controller";
import * as costAttributeValueController from "./controllers/cost-attribute-value.controller";
import * as priceController from "./controllers/price.controller";
import * as reportController from "./controllers/report.controller";
import * as googleSheetsController from "./controllers/google-sheets.controller";
import * as userController from "./controllers/user.controller";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = "/api";

  // AUTH ROUTES
  app.post(`${apiPrefix}/auth/login`, authController.login);
  app.post(`${apiPrefix}/auth/register`, authController.register);
  app.post(`${apiPrefix}/auth/logout`, authController.logout);
  app.get(`${apiPrefix}/auth/me`, optionalAuthMiddleware, authController.getCurrentUser);

  // BILL ROUTES
  app.get(`${apiPrefix}/bills`, authMiddleware, billController.getBills);
  app.post(`${apiPrefix}/bills`, authMiddleware, billController.createBill);
  app.get(`${apiPrefix}/bills/:id`, authMiddleware, billController.getBillById);
  app.patch(`${apiPrefix}/bills/:id`, authMiddleware, billController.updateBill);
  app.delete(`${apiPrefix}/bills/:id`, authMiddleware, billController.deleteBill);

  // COST ROUTES
  app.get(`${apiPrefix}/costs`, authMiddleware, costController.getCosts);
  app.post(`${apiPrefix}/costs`, authMiddleware, costController.createCost);
  app.get(`${apiPrefix}/costs/:id`, authMiddleware, costController.getCostById);
  app.patch(`${apiPrefix}/costs/:id`, authMiddleware, costController.updateCost);
  app.delete(`${apiPrefix}/costs/:id`, authMiddleware, costController.deleteCost);

  // REVENUE ROUTES
  app.get(`${apiPrefix}/revenues`, authMiddleware, revenueController.getRevenues);
  app.post(`${apiPrefix}/revenues`, authMiddleware, revenueController.createRevenue);
  app.get(`${apiPrefix}/revenues/:id`, authMiddleware, revenueController.getRevenueById);
  app.patch(`${apiPrefix}/revenues/:id`, authMiddleware, revenueController.updateRevenue);
  app.delete(`${apiPrefix}/revenues/:id`, authMiddleware, revenueController.deleteRevenue);

  // CUSTOMER ROUTES
  app.get(`${apiPrefix}/customers`, authMiddleware, customerController.getCustomers);
  app.post(`${apiPrefix}/customers`, authMiddleware, customerController.createCustomer);
  app.get(`${apiPrefix}/customers/:id`, authMiddleware, customerController.getCustomerById);
  app.patch(`${apiPrefix}/customers/:id`, authMiddleware, customerController.updateCustomer);
  app.delete(`${apiPrefix}/customers/:id`, authMiddleware, customerController.deleteCustomer);

  // SUPPLIER ROUTES
  app.get(`${apiPrefix}/suppliers`, authMiddleware, supplierController.getSuppliers);
  app.post(`${apiPrefix}/suppliers`, authMiddleware, supplierController.createSupplier);
  app.get(`${apiPrefix}/suppliers/:id`, authMiddleware, supplierController.getSupplierById);
  app.patch(`${apiPrefix}/suppliers/:id`, authMiddleware, supplierController.updateSupplier);
  app.delete(`${apiPrefix}/suppliers/:id`, authMiddleware, supplierController.deleteSupplier);

  // SERVICE ROUTES
  app.get(`${apiPrefix}/services`, authMiddleware, serviceController.getServices);
  app.post(`${apiPrefix}/services`, authMiddleware, serviceController.createService);
  app.get(`${apiPrefix}/services/:id`, authMiddleware, serviceController.getServiceById);
  app.patch(`${apiPrefix}/services/:id`, authMiddleware, serviceController.updateService);
  app.delete(`${apiPrefix}/services/:id`, authMiddleware, serviceController.deleteService);

  // COST TYPE ROUTES
  app.get(`${apiPrefix}/cost-types`, authMiddleware, costTypeController.getCostTypes);
  app.post(`${apiPrefix}/cost-types`, authMiddleware, costTypeController.createCostType);
  app.get(`${apiPrefix}/cost-types/:id`, authMiddleware, costTypeController.getCostTypeById);
  app.patch(`${apiPrefix}/cost-types/:id`, authMiddleware, costTypeController.updateCostType);
  app.delete(`${apiPrefix}/cost-types/:id`, authMiddleware, costTypeController.deleteCostType);

  // COST TYPE ATTRIBUTE ROUTES
  app.get(`${apiPrefix}/cost-type-attributes`, authMiddleware, costTypeAttributeController.getCostTypeAttributes);
  app.post(`${apiPrefix}/cost-type-attributes`, authMiddleware, costTypeAttributeController.createCostTypeAttribute);
  app.get(`${apiPrefix}/cost-type-attributes/:id`, authMiddleware, costTypeAttributeController.getCostTypeAttributeById);
  app.patch(`${apiPrefix}/cost-type-attributes/:id`, authMiddleware, costTypeAttributeController.updateCostTypeAttribute);
  app.delete(`${apiPrefix}/cost-type-attributes/:id`, authMiddleware, costTypeAttributeController.deleteCostTypeAttribute);

  // COST ATTRIBUTE VALUE ROUTES
  app.get(`${apiPrefix}/cost-attribute-values`, authMiddleware, costAttributeValueController.getCostAttributeValues);
  app.post(`${apiPrefix}/cost-attribute-values`, authMiddleware, costAttributeValueController.createCostAttributeValue);
  app.get(`${apiPrefix}/cost-attribute-values/:id`, authMiddleware, costAttributeValueController.getCostAttributeValueById);
  app.delete(`${apiPrefix}/cost-attribute-values/:id`, authMiddleware, costAttributeValueController.deleteCostAttributeValue);

  // PRICE ROUTES
  app.get(`${apiPrefix}/prices`, authMiddleware, priceController.getPrices);
  app.post(`${apiPrefix}/prices`, authMiddleware, priceController.createPrice);
  app.get(`${apiPrefix}/prices/:id`, authMiddleware, priceController.getPriceById);
  app.patch(`${apiPrefix}/prices/:id`, authMiddleware, priceController.updatePrice);
  app.delete(`${apiPrefix}/prices/:id`, authMiddleware, priceController.deletePrice);
  app.get(`${apiPrefix}/prices/customer/:customerId/service/:serviceId`, authMiddleware, priceController.getPriceByCustomerAndService);

  // REPORT ROUTES
  app.get(`${apiPrefix}/dashboard`, authMiddleware, reportController.getDashboardData);
  app.get(`${apiPrefix}/reports/by-customer`, authMiddleware, reportController.getReportByCustomer);
  app.get(`${apiPrefix}/reports/by-supplier`, authMiddleware, reportController.getReportBySupplier);
  app.get(`${apiPrefix}/reports/profit-loss`, authMiddleware, reportController.getProfitLossReport);
  app.get(`${apiPrefix}/reports/bills`, authMiddleware, reportController.getBillDetailReport);
  app.get(`${apiPrefix}/reports/by-customer/export`, authMiddleware, reportController.exportReportByCustomer);
  app.get(`${apiPrefix}/reports/by-supplier/export`, authMiddleware, reportController.exportReportBySupplier);
  app.get(`${apiPrefix}/reports/profit-loss/export`, authMiddleware, reportController.exportProfitLossReport);
  app.get(`${apiPrefix}/reports/bills/export`, authMiddleware, reportController.exportBillDetailReport);

  // GOOGLE SHEETS ROUTES
  app.get(`${apiPrefix}/settings/google-sheets`, authMiddleware, googleSheetsController.getSettings);
  app.post(`${apiPrefix}/settings/google-sheets`, authMiddleware, googleSheetsController.saveSettings);
  app.post(`${apiPrefix}/settings/google-sheets/test`, authMiddleware, googleSheetsController.testConnection);
  app.post(`${apiPrefix}/settings/google-sheets/sync`, authMiddleware, googleSheetsController.syncData);

  // USER MANAGEMENT ROUTES
  app.get(`${apiPrefix}/users`, authMiddleware, userController.getUsers);
  app.get(`${apiPrefix}/users/:id`, authMiddleware, userController.getUserById);
  app.post(`${apiPrefix}/users`, authMiddleware, userController.createUser);
  app.patch(`${apiPrefix}/users/:id/permissions`, authMiddleware, userController.updateUserPermissions);
  app.patch(`${apiPrefix}/users/:id/password`, authMiddleware, userController.updateUserPassword);
  app.delete(`${apiPrefix}/users/:id`, authMiddleware, userController.deleteUser);

  const httpServer = createServer(app);

  return httpServer;
}
