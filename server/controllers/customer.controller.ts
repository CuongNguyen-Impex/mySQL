import { Request, Response } from "express";
import { db } from "@db";
import { customers, insertCustomerSchema } from "@shared/schema";
import { eq, like } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sampleCustomers } from "../mock-data";
import { useMockData } from "../use-mock-data";

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      let query = db.query.customers.findMany({
        orderBy: customers.name
      });
      
      if (search) {
        query = db.query.customers.findMany({
          where: like(customers.name, `%${search}%`),
          orderBy: customers.name
        });
      }
      
      return await query;
    };
    
    // Sử dụng mockData khi có lỗi kết nối
    const result = await useMockData(
      queryDatabase,
      sampleCustomers,
      "Error getting customers"
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting customers:", error);
    // Nếu có lỗi khác, trả về dữ liệu mẫu
    return res.status(200).json(sampleCustomers);
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customerData = insertCustomerSchema.parse(req.body);
    
    // Check if customer already exists
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.name, customerData.name)
    });
    
    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer with this name already exists"
      });
    }
    
    const [newCustomer] = await db.insert(customers).values(customerData).returning();
    
    return res.status(201).json(newCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating customer"
    });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, Number(id))
      });
      
      if (!customer) {
        throw new Error("Customer not found");
      }
      
      return customer;
    };
    
    // Tìm khách hàng trong dữ liệu mẫu
    const findMockCustomer = () => {
      const customer = sampleCustomers.find(c => c.id === Number(id));
      
      if (!customer) {
        return res.status(404).json({
          message: "Customer not found"
        });
      }
      
      return customer;
    };
    
    // Sử dụng helper để kết hợp database thật và dữ liệu mẫu
    const customer = await useMockData(
      queryDatabase,
      findMockCustomer(),
      "Error getting customer"
    );
    
    return res.status(200).json(customer);
  } catch (error) {
    console.error("Error getting customer:", error);
    
    // Nếu lỗi là "Customer not found"
    if (error instanceof Error && error.message === "Customer not found") {
      return res.status(404).json({
        message: "Customer not found"
      });
    }
    
    // Lỗi khác, thử lấy từ dữ liệu mẫu
    const { id } = req.params;
    const customer = sampleCustomers.find(c => c.id === Number(id));
    
    if (customer) {
      return res.status(200).json(customer);
    }
    
    return res.status(500).json({
      message: "Server error getting customer"
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerData = insertCustomerSchema.parse(req.body);
    
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, Number(id))
    });
    
    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }
    
    // Check if customer name already exists (not the same customer)
    const duplicateCustomer = await db.query.customers.findFirst({
      where: eq(customers.name, customerData.name)
    });
    
    if (duplicateCustomer && duplicateCustomer.id !== Number(id)) {
      return res.status(400).json({
        message: "Customer with this name already exists"
      });
    }
    
    const [updatedCustomer] = await db.update(customers)
      .set({
        ...customerData,
        updatedAt: new Date()
      })
      .where(eq(customers.id, Number(id)))
      .returning();
    
    return res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error updating customer"
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, Number(id))
    });
    
    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }
    
    // Check if customer has bills (this is enforced by the database, but let's check it first)
    const customerBills = await db.query.bills.findMany({
      where: eq(customers.id, Number(id))
    });
    
    if (customerBills.length > 0) {
      return res.status(400).json({
        message: "Cannot delete customer with existing bills"
      });
    }
    
    await db.delete(customers).where(eq(customers.id, Number(id)));
    
    return res.status(200).json({
      message: "Customer deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(500).json({
      message: "Server error deleting customer"
    });
  }
};
