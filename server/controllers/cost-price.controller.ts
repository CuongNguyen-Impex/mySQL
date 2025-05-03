import { Request, Response } from 'express';
import { db } from "../../db";
import { costPrices, costPricesRelations } from "../../shared/schema";
import { insertCostPriceSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

export const getCostPrices = async (req: Request, res: Response) => {
  try {
    const costPricesList = await db.query.costPrices.findMany({
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });
    return res.json(costPricesList);
  } catch (error: any) {
    console.error('Error getting cost prices:', error);
    return res.status(500).json({ error: 'Failed to retrieve cost prices' });
  }
};

export const createCostPrice = async (req: Request, res: Response) => {
  try {
    // Parse and validate input data
    const data = insertCostPriceSchema.parse(req.body);
    
    // Check if a price with the same combination already exists
    const existingPrice = await db.query.costPrices.findFirst({
      where: and(
        eq(costPrices.customerId, data.customerId),
        eq(costPrices.serviceId, data.serviceId),
        eq(costPrices.costTypeId, data.costTypeId)
      )
    });

    if (existingPrice) {
      return res.status(400).json({
        error: 'A price with this combination of customer, service, and cost type already exists.'
      });
    }

    // Create new price
    const [newPrice] = await db.insert(costPrices).values(data).returning();
    
    // Return the created price
    return res.status(201).json(newPrice);
  } catch (error: any) {
    console.error('Error creating cost price:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Failed to create cost price' });
  }
};

export const getCostPriceById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const price = await db.query.costPrices.findFirst({
      where: eq(costPrices.id, id),
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });

    if (!price) {
      return res.status(404).json({ error: 'Cost price not found' });
    }

    return res.json(price);
  } catch (error: any) {
    console.error('Error getting cost price by ID:', error);
    return res.status(500).json({ error: 'Failed to retrieve cost price' });
  }
};

export const updateCostPrice = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if price exists
    const existingPrice = await db.query.costPrices.findFirst({
      where: eq(costPrices.id, id)
    });

    if (!existingPrice) {
      return res.status(404).json({ error: 'Cost price not found' });
    }

    // Parse and validate update data
    const data = insertCostPriceSchema.parse(req.body);

    // Check for conflicts with other prices
    if (data.customerId !== existingPrice.customerId || 
        data.serviceId !== existingPrice.serviceId || 
        data.costTypeId !== existingPrice.costTypeId) {
      const conflictPrice = await db.query.costPrices.findFirst({
        where: and(
          eq(costPrices.customerId, data.customerId),
          eq(costPrices.serviceId, data.serviceId),
          eq(costPrices.costTypeId, data.costTypeId)
        )
      });

      if (conflictPrice && conflictPrice.id !== id) {
        return res.status(400).json({
          error: 'A price with this combination of customer, service, and cost type already exists.'
        });
      }
    }

    // Update price
    const [updatedPrice] = await db
      .update(costPrices)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(costPrices.id, id))
      .returning();

    return res.json(updatedPrice);
  } catch (error: any) {
    console.error('Error updating cost price:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Failed to update cost price' });
  }
};

export const deleteCostPrice = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if price exists
    const existingPrice = await db.query.costPrices.findFirst({
      where: eq(costPrices.id, id)
    });

    if (!existingPrice) {
      return res.status(404).json({ error: 'Cost price not found' });
    }

    // Delete price
    await db.delete(costPrices).where(eq(costPrices.id, id));

    return res.status(200).json({ message: 'Cost price deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cost price:', error);
    return res.status(500).json({ error: 'Failed to delete cost price' });
  }
};

export const getCostPricesByCustomerAndService = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const serviceId = parseInt(req.params.serviceId);
    
    if (isNaN(customerId) || isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid customer ID or service ID format' });
    }

    const prices = await db.query.costPrices.findMany({
      where: and(
        eq(costPrices.customerId, customerId),
        eq(costPrices.serviceId, serviceId)
      ),
      with: {
        costType: true
      }
    });

    return res.json(prices);
  } catch (error: any) {
    console.error('Error getting cost prices by customer and service:', error);
    return res.status(500).json({ error: 'Failed to retrieve cost prices' });
  }
};
