import { Request, Response } from "express";
import { db } from "@db";
import { revenues, revenuesRelations, insertRevenueSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const getRevenues = async (req: Request, res: Response) => {
  try {
    const { billId } = req.query;
    
    let query = db.query.revenues.findMany({
      with: {
        bill: true,
        service: true
      },
      orderBy: desc(revenues.date)
    });
    
    if (billId) {
      query = db.query.revenues.findMany({
        with: {
          bill: true,
          service: true
        },
        where: eq(revenues.billId, Number(billId)),
        orderBy: desc(revenues.date)
      });
    }
    
    const result = await query;
    
    return res.status(200).json({ revenues: result });
  } catch (error) {
    console.error("Error getting revenues:", error);
    return res.status(500).json({
      message: "Server error getting revenues"
    });
  }
};

export const createRevenue = async (req: Request, res: Response) => {
  try {
    const revenueData = insertRevenueSchema.parse(req.body);
    
    const [newRevenue] = await db.insert(revenues).values(revenueData).returning();
    
    // Get revenue with relations
    const revenueWithRelations = await db.query.revenues.findFirst({
      where: eq(revenues.id, newRevenue.id),
      with: {
        bill: true,
        service: true
      }
    });
    
    return res.status(201).json(revenueWithRelations);
  } catch (error) {
    console.error("Error creating revenue:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating revenue"
    });
  }
};

export const getRevenueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const revenue = await db.query.revenues.findFirst({
      where: eq(revenues.id, Number(id)),
      with: {
        bill: true,
        service: true
      }
    });
    
    if (!revenue) {
      return res.status(404).json({
        message: "Revenue not found"
      });
    }
    
    return res.status(200).json(revenue);
  } catch (error) {
    console.error("Error getting revenue:", error);
    return res.status(500).json({
      message: "Server error getting revenue"
    });
  }
};

export const updateRevenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const revenueData = insertRevenueSchema.parse(req.body);
    
    const existingRevenue = await db.query.revenues.findFirst({
      where: eq(revenues.id, Number(id))
    });
    
    if (!existingRevenue) {
      return res.status(404).json({
        message: "Revenue not found"
      });
    }
    
    const [updatedRevenue] = await db.update(revenues)
      .set({
        ...revenueData,
        updatedAt: new Date()
      })
      .where(eq(revenues.id, Number(id)))
      .returning();
    
    // Get revenue with relations
    const revenueWithRelations = await db.query.revenues.findFirst({
      where: eq(revenues.id, updatedRevenue.id),
      with: {
        bill: true,
        service: true
      }
    });
    
    return res.status(200).json(revenueWithRelations);
  } catch (error) {
    console.error("Error updating revenue:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error updating revenue"
    });
  }
};

export const deleteRevenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingRevenue = await db.query.revenues.findFirst({
      where: eq(revenues.id, Number(id))
    });
    
    if (!existingRevenue) {
      return res.status(404).json({
        message: "Revenue not found"
      });
    }
    
    await db.delete(revenues).where(eq(revenues.id, Number(id)));
    
    return res.status(200).json({
      message: "Revenue deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting revenue:", error);
    return res.status(500).json({
      message: "Server error deleting revenue"
    });
  }
};
