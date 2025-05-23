import { Request, Response } from "express";
import { db } from "@db";
import { costs, costsRelations, insertCostSchema, costAttributeValues, insertCostAttributeValueSchema } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const getCosts = async (req: Request, res: Response) => {
  try {
    const { billId } = req.query;
    
    let query = db.query.costs.findMany({
      with: {
        bill: true,
        costType: true,
        supplier: true
      },

      orderBy: desc(costs.date)
    });
    
    if (billId) {
      query = db.query.costs.findMany({
        with: {
          bill: true,
          costType: true,
          supplier: true
        },

        where: eq(costs.billId, Number(billId)),
        orderBy: desc(costs.date)
      });
    }
    
    const result = await query;
    
    return res.status(200).json({ costs: result });
  } catch (error) {
    console.error("Error getting costs:", error);
    return res.status(500).json({
      message: "Server error getting costs"
    });
  }
};

export const createCost = async (req: Request, res: Response) => {
  try {
    const costData = req.body;
    
    // Validate cost data
    const validatedCostData = insertCostSchema.parse(costData);
    
    // Create the cost
    const [newCost] = await db.insert(costs).values(validatedCostData).returning();
      
    // Get cost with relations
    const result = await db.query.costs.findFirst({
      where: eq(costs.id, newCost.id),
      with: {
        bill: true,
        costType: true,
        supplier: true
      }
    });
    
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating cost:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating cost"
    });
  }
};

export const getCostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const cost = await db.query.costs.findFirst({
      where: eq(costs.id, Number(id)),
      with: {
        bill: true,
        costType: true,
        supplier: true
      }
    });
    
    if (!cost) {
      return res.status(404).json({
        message: "Cost not found"
      });
    }
    
    return res.status(200).json(cost);
  } catch (error) {
    console.error("Error getting cost:", error);
    return res.status(500).json({
      message: "Server error getting cost"
    });
  }
};

export const updateCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const costData = req.body;
    
    // Validate cost data
    const validatedCostData = insertCostSchema.parse(costData);
    
    const existingCost = await db.query.costs.findFirst({
      where: eq(costs.id, Number(id))
    });
    
    if (!existingCost) {
      return res.status(404).json({
        message: "Cost not found"
      });
    }
    
    // Update the cost
    const [updatedCost] = await db.update(costs)
      .set({
        ...validatedCostData,
        updatedAt: new Date()
      })
      .where(eq(costs.id, Number(id)))
      .returning();
    
    // Get cost with relations
    const result = await db.query.costs.findFirst({
      where: eq(costs.id, updatedCost.id),
      with: {
        bill: true,
        costType: true,
        supplier: true
      }
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating cost:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error updating cost"
    });
  }
};

export const deleteCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingCost = await db.query.costs.findFirst({
      where: eq(costs.id, Number(id))
    });
    
    if (!existingCost) {
      return res.status(404).json({
        message: "Cost not found"
      });
    }
    
    // Begin a transaction to delete cost and attribute values
    await db.transaction(async (tx) => {
      // First delete all attribute values for this cost
      await tx.delete(costAttributeValues)
        .where(eq(costAttributeValues.costId, Number(id)));
      
      // Then delete the cost
      await tx.delete(costs).where(eq(costs.id, Number(id)));
    });
    
    return res.status(200).json({
      message: "Cost deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting cost:", error);
    return res.status(500).json({
      message: "Server error deleting cost"
    });
  }
};
