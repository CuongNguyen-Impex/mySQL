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
    
    const results = await query;
    
    // Calculate totals and profit for each bill
    const billsWithTotals = results.map(bill => {
      let totalCost = 0;
      let totalHoaDonCost = 0; // Chỉ bao gồm chi phí có hóa đơn
      let totalRevenue = 0;
      
      // Sum costs
      if (bill.costs && bill.costs.length > 0) {
        bill.costs.forEach(cost => {
          const amount = parseFloat(cost.amount.toString());
          totalCost += amount;
          
          // Chỉ tính vào lợi nhuận các chi phí "Hóa đơn"
          if (cost.tt_hd === "Hóa đơn") {
            totalHoaDonCost += amount;
          }
        });
      }
      
      // Sum revenues
      if (bill.revenues && bill.revenues.length > 0) {
        bill.revenues.forEach(revenue => {
          totalRevenue += parseFloat(revenue.amount.toString());
        });
      }
      
      // Calculate profit based only on 'Hóa đơn' costs
      const profit = totalRevenue - totalHoaDonCost;
      
      return {
        ...bill,
        totalCost,
        totalHoaDonCost,
        totalRevenue,
        profit
      };
    });
    
    return res.status(200).json({ bills: billsWithTotals });
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
        }
      }
    });
    
    // Lấy giá bán theo từng loại chi phí (cost_prices)
    // cho khách hàng và dịch vụ tương ứng của hóa đơn này
    if (bill) {
      const costPrices = await db.query.costPrices.findMany({
        where: and(
          eq(costPrices.customerId, bill.customerId),
          eq(costPrices.serviceId, bill.serviceId)
        ),
        with: {
          costType: true
        }
      });
      
      // Thêm costPrices vào đối tượng bill
      bill.costPrices = costPrices;
    }
    
    if (!bill) {
      return res.status(404).json({
        message: "Bill not found"
      });
    }
    
    // Tính toán tổng chi phí (totalCost)
    let totalCost = 0;
    let totalHoaDonCost = 0; // Chỉ bao gồm chi phí có hóa đơn
    
    if (bill.costs && bill.costs.length > 0) {
      bill.costs.forEach(cost => {
        const amount = parseFloat(cost.amount.toString());
        totalCost += amount;
        
        // Chỉ tính vào lợi nhuận các chi phí "Hóa đơn"
        if (cost.tt_hd === "Hóa đơn") {
          totalHoaDonCost += amount;
        }
      });
    }
    
    // Tính toán tổng doanh thu (totalRevenue) từ cost_prices
    let totalRevenue = 0;
    
    if (bill.costs && bill.costs.length > 0 && bill.costPrices && bill.costPrices.length > 0) {
      bill.costs.forEach(cost => {
        // Tìm giá tương ứng cho loại chi phí này
        const costPrice = bill.costPrices.find(cp => cp.costTypeId === cost.costTypeId);
        
        // Nếu tìm thấy giá, thêm vào tổng doanh thu
        if (costPrice) {
          totalRevenue += parseFloat(costPrice.price.toString());
        }
      });
    }
    
    // Tính lợi nhuận (profit) - chỉ dựa trên chi phí có hóa đơn
    const profit = totalRevenue - totalHoaDonCost;
    
    const billWithData = {
      ...bill,
      totalCost,
      totalHoaDonCost,
      totalRevenue,
      profit
    };
    
    return res.status(200).json(billWithData);
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
