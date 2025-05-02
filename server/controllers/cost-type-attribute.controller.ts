import { Request, Response } from "express";
import { db } from "@db";
import { costTypeAttributes, costTypes, insertCostTypeAttributeSchema } from "@shared/schema";
import { eq, and, like } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const getCostTypeAttributes = async (req: Request, res: Response) => {
  try {
    const { costTypeId, search } = req.query;
    
    let query = db.query.costTypeAttributes.findMany({
      orderBy: costTypeAttributes.name,
      with: {
        costType: true
      }
    });
    
    if (costTypeId) {
      query = db.query.costTypeAttributes.findMany({
        where: eq(costTypeAttributes.costTypeId, Number(costTypeId)),
        orderBy: costTypeAttributes.name,
        with: {
          costType: true
        }
      });
    }
    
    if (search) {
      query = db.query.costTypeAttributes.findMany({
        where: like(costTypeAttributes.name, `%${search}%`),
        orderBy: costTypeAttributes.name,
        with: {
          costType: true
        }
      });
    }
    
    const result = await query;
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting cost type attributes:", error);
    return res.status(500).json({
      message: "Server error getting cost type attributes"
    });
  }
};

export const createCostTypeAttribute = async (req: Request, res: Response) => {
  try {
    const attributeData = insertCostTypeAttributeSchema.parse(req.body);
    
    // Check if cost type exists
    const costType = await db.query.costTypes.findFirst({
      where: eq(costTypes.id, attributeData.costTypeId)
    });
    
    if (!costType) {
      return res.status(400).json({
        message: "Cost type not found"
      });
    }
    
    // Check if attribute already exists for this cost type
    const existingAttribute = await db.query.costTypeAttributes.findFirst({
      where: and(
        eq(costTypeAttributes.costTypeId, attributeData.costTypeId),
        eq(costTypeAttributes.name, attributeData.name)
      )
    });
    
    if (existingAttribute) {
      return res.status(400).json({
        message: "Attribute with this name already exists for this cost type"
      });
    }
    
    const [newAttribute] = await db.insert(costTypeAttributes).values(attributeData).returning();
    
    // Get the complete data with relations
    const attributeWithRelations = await db.query.costTypeAttributes.findFirst({
      where: eq(costTypeAttributes.id, newAttribute.id),
      with: {
        costType: true
      }
    });
    
    return res.status(201).json(attributeWithRelations);
  } catch (error) {
    console.error("Error creating cost type attribute:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating cost type attribute"
    });
  }
};

export const getCostTypeAttributeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const attribute = await db.query.costTypeAttributes.findFirst({
      where: eq(costTypeAttributes.id, Number(id)),
      with: {
        costType: true
      }
    });
    
    if (!attribute) {
      return res.status(404).json({
        message: "Cost type attribute not found"
      });
    }
    
    return res.status(200).json(attribute);
  } catch (error) {
    console.error("Error getting cost type attribute:", error);
    return res.status(500).json({
      message: "Server error getting cost type attribute"
    });
  }
};

export const updateCostTypeAttribute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const attributeData = insertCostTypeAttributeSchema.parse(req.body);
    
    const existingAttribute = await db.query.costTypeAttributes.findFirst({
      where: eq(costTypeAttributes.id, Number(id))
    });
    
    if (!existingAttribute) {
      return res.status(404).json({
        message: "Cost type attribute not found"
      });
    }
    
    // Check if cost type exists
    const costType = await db.query.costTypes.findFirst({
      where: eq(costTypes.id, attributeData.costTypeId)
    });
    
    if (!costType) {
      return res.status(400).json({
        message: "Cost type not found"
      });
    }
    
    // Check if attribute already exists for this cost type (not the same attribute)
    const duplicateAttribute = await db.query.costTypeAttributes.findFirst({
      where: and(
        eq(costTypeAttributes.costTypeId, attributeData.costTypeId),
        eq(costTypeAttributes.name, attributeData.name)
      )
    });
    
    if (duplicateAttribute && duplicateAttribute.id !== Number(id)) {
      return res.status(400).json({
        message: "Attribute with this name already exists for this cost type"
      });
    }
    
    const [updatedAttribute] = await db.update(costTypeAttributes)
      .set({
        ...attributeData,
        updatedAt: new Date()
      })
      .where(eq(costTypeAttributes.id, Number(id)))
      .returning();
    
    // Get the complete data with relations
    const attributeWithRelations = await db.query.costTypeAttributes.findFirst({
      where: eq(costTypeAttributes.id, updatedAttribute.id),
      with: {
        costType: true
      }
    });
    
    return res.status(200).json(attributeWithRelations);
  } catch (error) {
    console.error("Error updating cost type attribute:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error updating cost type attribute"
    });
  }
};

export const deleteCostTypeAttribute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingAttribute = await db.query.costTypeAttributes.findFirst({
      where: eq(costTypeAttributes.id, Number(id))
    });
    
    if (!existingAttribute) {
      return res.status(404).json({
        message: "Cost type attribute not found"
      });
    }
    
    // Check if the attribute is used in any cost (would be enforced by the database)
    const attributeInUse = await db.query.costAttributeValues.findFirst({
      where: eq(costTypeAttributes.id, Number(id))
    });
    
    if (attributeInUse) {
      return res.status(400).json({
        message: "Cannot delete attribute that is in use"
      });
    }
    
    await db.delete(costTypeAttributes).where(eq(costTypeAttributes.id, Number(id)));
    
    return res.status(200).json({
      message: "Cost type attribute deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting cost type attribute:", error);
    return res.status(500).json({
      message: "Server error deleting cost type attribute"
    });
  }
};
