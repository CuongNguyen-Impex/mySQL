import { Request, Response } from "express";
import { db } from "@db";
import { costAttributeValues, costs, costTypeAttributes, insertCostAttributeValueSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const getCostAttributeValues = async (req: Request, res: Response) => {
  try {
    const { costId } = req.query;
    
    let query = db.query.costAttributeValues.findMany({
      with: {
        cost: true,
        attribute: {
          with: {
            costType: true
          }
        }
      }
    });
    
    if (costId) {
      query = db.query.costAttributeValues.findMany({
        where: eq(costAttributeValues.costId, Number(costId)),
        with: {
          cost: true,
          attribute: {
            with: {
              costType: true
            }
          }
        }
      });
    }
    
    const result = await query;
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting cost attribute values:", error);
    return res.status(500).json({
      message: "Server error getting cost attribute values"
    });
  }
};

export const createCostAttributeValue = async (req: Request, res: Response) => {
  try {
    const valueData = insertCostAttributeValueSchema.parse(req.body);
    
    // Check if cost exists
    const cost = await db.query.costs.findFirst({
      where: eq(costs.id, valueData.costId)
    });
    
    if (!cost) {
      return res.status(400).json({
        message: "Cost not found"
      });
    }
    
    // Check if attribute exists
    const attribute = await db.query.costTypeAttributes.findFirst({
      where: eq(costTypeAttributes.id, valueData.attributeId)
    });
    
    if (!attribute) {
      return res.status(400).json({
        message: "Cost type attribute not found"
      });
    }
    
    // Check if the attribute belongs to the cost type of the cost
    const costWithType = await db.query.costs.findFirst({
      where: eq(costs.id, valueData.costId),
      with: {
        costType: true
      }
    });
    
    if (costWithType && attribute.costTypeId !== costWithType.costType?.id) {
      return res.status(400).json({
        message: "Attribute does not belong to the cost type of the cost"
      });
    }
    
    // Check if this cost already has this attribute (avoid duplicates)
    const existingValue = await db.query.costAttributeValues.findFirst({
      where: and(
        eq(costAttributeValues.costId, valueData.costId),
        eq(costAttributeValues.attributeId, valueData.attributeId)
      )
    });
    
    if (existingValue) {
      return res.status(400).json({
        message: "This cost already has this attribute"
      });
    }
    
    const [newValue] = await db.insert(costAttributeValues).values(valueData).returning();
    
    // Get the complete data with relations
    const valueWithRelations = await db.query.costAttributeValues.findFirst({
      where: eq(costAttributeValues.id, newValue.id),
      with: {
        cost: true,
        attribute: {
          with: {
            costType: true
          }
        }
      }
    });
    
    return res.status(201).json(valueWithRelations);
  } catch (error) {
    console.error("Error creating cost attribute value:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating cost attribute value"
    });
  }
};

export const getCostAttributeValueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const value = await db.query.costAttributeValues.findFirst({
      where: eq(costAttributeValues.id, Number(id)),
      with: {
        cost: true,
        attribute: {
          with: {
            costType: true
          }
        }
      }
    });
    
    if (!value) {
      return res.status(404).json({
        message: "Cost attribute value not found"
      });
    }
    
    return res.status(200).json(value);
  } catch (error) {
    console.error("Error getting cost attribute value:", error);
    return res.status(500).json({
      message: "Server error getting cost attribute value"
    });
  }
};

export const deleteCostAttributeValue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingValue = await db.query.costAttributeValues.findFirst({
      where: eq(costAttributeValues.id, Number(id))
    });
    
    if (!existingValue) {
      return res.status(404).json({
        message: "Cost attribute value not found"
      });
    }
    
    await db.delete(costAttributeValues).where(eq(costAttributeValues.id, Number(id)));
    
    return res.status(200).json({
      message: "Cost attribute value deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting cost attribute value:", error);
    return res.status(500).json({
      message: "Server error deleting cost attribute value"
    });
  }
};
