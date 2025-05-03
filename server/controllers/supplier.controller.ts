import { Request, Response } from "express";
import { db } from "@db";
import { suppliers, insertSupplierSchema, costs } from "@shared/schema";
import { eq, like } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sampleSuppliers } from "../mock-data";
import { useMockData } from "../use-mock-data";

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      let query = db.query.suppliers.findMany({
        orderBy: suppliers.name
      });
      
      if (search) {
        query = db.query.suppliers.findMany({
          where: like(suppliers.name, `%${search}%`),
          orderBy: suppliers.name
        });
      }
      
      return await query;
    };
    
    // Sử dụng mockData khi có lỗi kết nối
    const result = await useMockData(
      queryDatabase,
      sampleSuppliers,
      "Error getting suppliers"
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting suppliers:", error);
    // Nếu có lỗi khác, trả về dữ liệu mẫu
    return res.status(200).json(sampleSuppliers);
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const supplierData = insertSupplierSchema.parse(req.body);
    
    // Check if supplier already exists
    const existingSupplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.name, supplierData.name)
    });
    
    if (existingSupplier) {
      return res.status(400).json({
        message: "Supplier with this name already exists"
      });
    }
    
    const [newSupplier] = await db.insert(suppliers).values(supplierData).returning();
    
    return res.status(201).json(newSupplier);
  } catch (error) {
    console.error("Error creating supplier:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating supplier"
    });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      const supplier = await db.query.suppliers.findFirst({
        where: eq(suppliers.id, Number(id))
      });
      
      if (!supplier) {
        throw new Error("Supplier not found");
      }
      
      return supplier;
    };
    
    // Tìm nhà cung cấp trong dữ liệu mẫu
    const findMockSupplier = () => {
      const supplier = sampleSuppliers.find(s => s.id === Number(id));
      
      if (!supplier) {
        return res.status(404).json({
          message: "Supplier not found"
        });
      }
      
      return supplier;
    };
    
    // Sử dụng helper để kết hợp database thật và dữ liệu mẫu
    const supplier = await useMockData(
      queryDatabase,
      findMockSupplier(),
      "Error getting supplier"
    );
    
    return res.status(200).json(supplier);
  } catch (error) {
    console.error("Error getting supplier:", error);
    
    // Nếu lỗi là "Supplier not found"
    if (error instanceof Error && error.message === "Supplier not found") {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }
    
    // Lỗi khác, thử lấy từ dữ liệu mẫu
    const { id } = req.params;
    const supplier = sampleSuppliers.find(s => s.id === Number(id));
    
    if (supplier) {
      return res.status(200).json(supplier);
    }
    
    return res.status(500).json({
      message: "Server error getting supplier"
    });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplierData = insertSupplierSchema.parse(req.body);
    
    const existingSupplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, Number(id))
    });
    
    if (!existingSupplier) {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }
    
    // Check if supplier name already exists (not the same supplier)
    const duplicateSupplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.name, supplierData.name)
    });
    
    if (duplicateSupplier && duplicateSupplier.id !== Number(id)) {
      return res.status(400).json({
        message: "Supplier with this name already exists"
      });
    }
    
    const [updatedSupplier] = await db.update(suppliers)
      .set({
        ...supplierData,
        updatedAt: new Date()
      })
      .where(eq(suppliers.id, Number(id)))
      .returning();
    
    return res.status(200).json(updatedSupplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error updating supplier"
    });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingSupplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, Number(id))
    });
    
    if (!existingSupplier) {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }
    
    // Check if supplier has costs (this is enforced by the database, but let's check it first)
    const supplierCosts = await db.query.costs.findMany({
      where: eq(costs.supplierId, Number(id))
    });
    
    if (supplierCosts.length > 0) {
      return res.status(400).json({
        message: "Cannot delete supplier with existing costs"
      });
    }
    
    await db.delete(suppliers).where(eq(suppliers.id, Number(id)));
    
    return res.status(200).json({
      message: "Supplier deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return res.status(500).json({
      message: "Server error deleting supplier"
    });
  }
};
