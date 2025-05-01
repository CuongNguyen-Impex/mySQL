import { Request, Response } from "express";
import { db } from "@db";
import { bills, billsRelations, insertBillSchema } from "@shared/schema";
import { eq, desc, like, and, between, or } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const getBills = async (req: Request, res: Response) => {
  try {
    const { customerId, serviceId, status, startDate, endDate, limit } = req.query;
    
    let query = db.query.bills.findMany({
      with: {
        customer: true,
        service: true,
        costs: true,
        revenues: true
      },
      orderBy: desc(bills.date)
    });
    
    // Apply filters if provided
    let whereConditions = [];
    
    if (customerId) {
      whereConditions.push(eq(bills.customerId, Number(customerId)));
    }
    
    if (serviceId) {
      whereConditions.push(eq(bills.serviceId, Number(serviceId)));
    }
    
    if (status && status !== 'all') {
      whereConditions.push(eq(bills.status, String(status)));
    }
    
    if (startDate && endDate) {
      whereConditions.push(between(bills.date, new Date(String(startDate)), new Date(String(endDate))));
    } else if (startDate) {
      whereConditions.push(bills.date >= new Date(String(startDate)));
    } else if (endDate) {
      whereConditions.push(bills.date <= new Date(String(endDate)));
    }
    
    // Apply combined conditions if any exist
    if (whereConditions.length > 0) {
      query = db.query.bills.findMany({
        with: {
          customer: true,
          service: true,
          costs: true,
          revenues: true
        },
        where: and(...whereConditions),
        orderBy: desc(bills.date)
      });
    }
    
    // Apply limit if provided
    if (limit) {
      query = db.query.bills.findMany({
        with: {
          customer: true,
          service: true,
          costs: true,
          revenues: true
        },
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        orderBy: desc(bills.date),
        limit: Number(limit)
      });
    }
    
    const result = await query;
    
    return res.status(200).json({ bills: result });
  } catch (error) {
    console.error("Error getting bills:", error);
    return res.status(500).json({
      message: "Server error getting bills"
    });
  }
};

export const createBill = async (req: Request, res: Response) => {
  try {
    const billData = insertBillSchema.parse(req.body);
    
    const [newBill] = await db.insert(bills).values(billData).returning();
    
    // Get bill with relations
    const billWithRelations = await db.query.bills.findFirst({
      where: eq(bills.id, newBill.id),
      with: {
        customer: true,
        service: true
      }
    });
    
    return res.status(201).json(billWithRelations);
  } catch (error) {
    console.error("Error creating bill:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating bill"
    });
  }
};

export const getBillById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const bill = await db.query.bills.findFirst({
      where: eq(bills.id, Number(id)),
      with: {
        customer: true,
        service: true,
        costs: {
          with: {
            costType: true,
            supplier: true
          }
        },
        revenues: {
          with: {
            service: true
          }
        }
      }
    });
    
    if (!bill) {
      return res.status(404).json({
        message: "Bill not found"
      });
    }
    
    return res.status(200).json(bill);
  } catch (error) {
    console.error("Error getting bill:", error);
    return res.status(500).json({
      message: "Server error getting bill"
    });
  }
};

export const updateBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Lấy dữ liệu bill hiện tại
    const existingBill = await db.query.bills.findFirst({
      where: eq(bills.id, Number(id))
    });
    
    if (!existingBill) {
      return res.status(404).json({
        message: "Bill not found"
      });
    }
    
    // Khi cập nhật trạng thái, chỉ cập nhật trường status
    if (req.body.status) {
      const [updatedBill] = await db.update(bills)
        .set({
          status: req.body.status,
          updatedAt: new Date()
        })
        .where(eq(bills.id, Number(id)))
        .returning();
      
      // Get bill with relations
      const billWithRelations = await db.query.bills.findFirst({
        where: eq(bills.id, updatedBill.id),
        with: {
          customer: true,
          service: true
        }
      });
      
      return res.status(200).json(billWithRelations);
    } else {
      // Khi cập nhật toàn bộ bill, kiểm tra kiểu dữ liệu date
      const billData = { ...req.body };

      // Đảm bảo date được xử lý đúng (nếu có)
      if (billData.date && typeof billData.date === 'string') {
        billData.date = new Date(billData.date);
      }

      const [updatedBill] = await db.update(bills)
        .set({
          ...billData,
          updatedAt: new Date()
        })
        .where(eq(bills.id, Number(id)))
        .returning();
      
      // Get bill with relations
      const billWithRelations = await db.query.bills.findFirst({
        where: eq(bills.id, updatedBill.id),
        with: {
          customer: true,
          service: true
        }
      });
      
      return res.status(200).json(billWithRelations);
    }
  } catch (error) {
    console.error("Error updating bill:", error);
        
    return res.status(500).json({
      message: "Server error updating bill"
    });
  }
};

export const deleteBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingBill = await db.query.bills.findFirst({
      where: eq(bills.id, Number(id))
    });
    
    if (!existingBill) {
      return res.status(404).json({
        message: "Bill not found"
      });
    }
    
    // Delete bill (costs and revenues will be deleted due to cascade)
    await db.delete(bills).where(eq(bills.id, Number(id)));
    
    return res.status(200).json({
      message: "Bill deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting bill:", error);
    return res.status(500).json({
      message: "Server error deleting bill"
    });
  }
};
