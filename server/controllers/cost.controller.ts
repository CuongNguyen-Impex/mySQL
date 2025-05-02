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
        supplier: true,
        attributeValues: {
          with: {
            attribute: true
          }
        }
      },

      orderBy: desc(costs.date)
    });
    
    if (billId) {
      query = db.query.costs.findMany({
        with: {
          bill: true,
          costType: true,
          supplier: true,
          attributeValues: {
            with: {
              attribute: true
            }
          }
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
    const { attributeValues: attributeValuesData, ...costData } = req.body;
    
    // Validate cost data
    const validatedCostData = insertCostSchema.parse(costData);
    
    // Begin a transaction to create cost and attribute values
    const result = await db.transaction(async (tx) => {
      // Create the cost
      const [newCost] = await tx.insert(costs).values(validatedCostData).returning();
      
      // If attribute values were provided, create them
      if (Array.isArray(attributeValuesData) && attributeValuesData.length > 0) {
        // Process each attribute value
        for (const valueData of attributeValuesData) {
          // Skip empty values
          if (!valueData.value) continue;
          
          // Create the attribute value
          console.log("Creating new attribute value for new cost:", {
            costId: newCost.id,
            attributeId: valueData.costTypeAttributeId,
            value: valueData.value,
          });
          
          await tx.insert(costAttributeValues).values({
            costId: newCost.id,
            attributeId: valueData.costTypeAttributeId,
            value: valueData.value,
          });
        }
      }
      
      // Get cost with relations
      return await db.query.costs.findFirst({
        where: eq(costs.id, newCost.id),
        with: {
          bill: true,
          costType: true,
          supplier: true,
          attributeValues: {
            with: {
              attribute: true
            }
          }
        }
      });
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
        supplier: true,
        attributeValues: {
          with: {
            attribute: true
          }
        }
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
    const { attributeValues: attributeValuesData, ...costData } = req.body;
    
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
    
    // Begin a transaction to update cost and attribute values
    const result = await db.transaction(async (tx) => {
      // Update the cost
      const [updatedCost] = await tx.update(costs)
        .set({
          ...validatedCostData,
          updatedAt: new Date()
        })
        .where(eq(costs.id, Number(id)))
        .returning();
      
      // If attribute values were provided, update them
      if (Array.isArray(attributeValuesData)) {
        // First, delete existing attribute values
        await tx.delete(costAttributeValues)
          .where(eq(costAttributeValues.costId, Number(id)));
          
        // Then create new attribute values
        for (const valueData of attributeValuesData) {
          // Skip empty values
          if (!valueData.value) continue;
          
          // Create the attribute value
          console.log("Creating attribute value:", {
            costId: updatedCost.id,
            attributeId: valueData.costTypeAttributeId,
            value: valueData.value,
          });
          
          await tx.insert(costAttributeValues).values({
            costId: updatedCost.id,
            attributeId: valueData.costTypeAttributeId,
            value: valueData.value,
          });
        }
      }
      
      // Get cost with relations
      return await db.query.costs.findFirst({
        where: eq(costs.id, updatedCost.id),
        with: {
          bill: true,
          costType: true,
          supplier: true,
          attributeValues: {
            with: {
              attribute: true
            }
          }
        }
      });
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
