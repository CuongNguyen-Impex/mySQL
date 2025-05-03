import { Request, Response } from "express";
import { db } from "@db";
import { costTypes, costs, insertCostTypeSchema } from "@shared/schema";
import { eq, like } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sampleCostTypes } from "../mock-data";
import { useMockData } from "../use-mock-data";

export const getCostTypes = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      let query = db.query.costTypes.findMany({
        orderBy: costTypes.name
      });
      
      if (search) {
        query = db.query.costTypes.findMany({
          where: like(costTypes.name, `%${search}%`),
          orderBy: costTypes.name
        });
      }
      
      return await query;
    };
    
    // Sử dụng helper để kết hợp database thật và dữ liệu mẫu
    const result = await useMockData(
      queryDatabase,
      sampleCostTypes,
      "Error getting cost types"
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting cost types:", error);
    // Trả về dữ liệu mẫu nếu có lỗi
    return res.status(200).json(sampleCostTypes);
  }
};

export const createCostType = async (req: Request, res: Response) => {
  try {
    const costTypeData = insertCostTypeSchema.parse(req.body);
    
    // Check if cost type already exists
    const existingCostType = await db.query.costTypes.findFirst({
      where: eq(costTypes.name, costTypeData.name)
    });
    
    if (existingCostType) {
      return res.status(400).json({
        message: "Cost type with this name already exists"
      });
    }
    
    const [newCostType] = await db.insert(costTypes).values(costTypeData).returning();
    
    return res.status(201).json(newCostType);
  } catch (error) {
    console.error("Error creating cost type:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating cost type"
    });
  }
};

export const getCostTypeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      const costType = await db.query.costTypes.findFirst({
        where: eq(costTypes.id, Number(id))
      });
      
      if (!costType) {
        throw new Error("Cost type not found");
      }
      
      return costType;
    };
    
    // Tìm loại chi phí trong dữ liệu mẫu
    const findMockCostType = () => {
      const costType = sampleCostTypes.find(ct => ct.id === Number(id));
      
      if (!costType) {
        return res.status(404).json({
          message: "Cost type not found"
        });
      }
      
      return costType;
    };
    
    // Sử dụng helper để kết hợp database thật và dữ liệu mẫu
    const costType = await useMockData(
      queryDatabase,
      findMockCostType(),
      "Error getting cost type"
    );
    
    return res.status(200).json(costType);
  } catch (error) {
    console.error("Error getting cost type:", error);
    
    // Nếu lỗi là "Cost type not found"
    if (error instanceof Error && error.message === "Cost type not found") {
      return res.status(404).json({
        message: "Cost type not found"
      });
    }
    
    // Lỗi khác, thử lấy từ dữ liệu mẫu
    const { id } = req.params;
    const costType = sampleCostTypes.find(ct => ct.id === Number(id));
    
    if (costType) {
      return res.status(200).json(costType);
    }
    
    return res.status(500).json({
      message: "Server error getting cost type"
    });
  }
};

export const updateCostType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const costTypeData = insertCostTypeSchema.parse(req.body);
    
    const existingCostType = await db.query.costTypes.findFirst({
      where: eq(costTypes.id, Number(id))
    });
    
    if (!existingCostType) {
      return res.status(404).json({
        message: "Cost type not found"
      });
    }
    
    // Check if cost type name already exists (not the same cost type)
    const duplicateCostType = await db.query.costTypes.findFirst({
      where: eq(costTypes.name, costTypeData.name)
    });
    
    if (duplicateCostType && duplicateCostType.id !== Number(id)) {
      return res.status(400).json({
        message: "Cost type with this name already exists"
      });
    }
    
    const [updatedCostType] = await db.update(costTypes)
      .set({
        ...costTypeData,
        updatedAt: new Date()
      })
      .where(eq(costTypes.id, Number(id)))
      .returning();
    
    return res.status(200).json(updatedCostType);
  } catch (error) {
    console.error("Error updating cost type:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error updating cost type"
    });
  }
};

export const deleteCostType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingCostType = await db.query.costTypes.findFirst({
      where: eq(costTypes.id, Number(id))
    });
    
    if (!existingCostType) {
      return res.status(404).json({
        message: "Cost type not found"
      });
    }
    
    // Check if cost type has costs (this is enforced by the database, but let's check it first)
    const costTypeCosts = await db.query.costs.findMany({
      where: eq(costs.costTypeId, Number(id))
    });
    
    if (costTypeCosts.length > 0) {
      return res.status(400).json({
        message: "Cannot delete cost type with existing costs"
      });
    }
    
    await db.delete(costTypes).where(eq(costTypes.id, Number(id)));
    
    return res.status(200).json({
      message: "Cost type deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting cost type:", error);
    return res.status(500).json({
      message: "Server error deleting cost type"
    });
  }
};
