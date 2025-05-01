import { Request, Response } from "express";
import { db } from "@db";
import { services, insertServiceSchema } from "@shared/schema";
import { eq, like } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const getServices = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    let query = db.query.services.findMany({
      orderBy: services.name
    });
    
    if (search) {
      query = db.query.services.findMany({
        where: like(services.name, `%${search}%`),
        orderBy: services.name
      });
    }
    
    const result = await query;
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting services:", error);
    return res.status(500).json({
      message: "Server error getting services"
    });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const serviceData = insertServiceSchema.parse(req.body);
    
    // Check if service already exists
    const existingService = await db.query.services.findFirst({
      where: eq(services.name, serviceData.name)
    });
    
    if (existingService) {
      return res.status(400).json({
        message: "Service with this name already exists"
      });
    }
    
    const [newService] = await db.insert(services).values(serviceData).returning();
    
    return res.status(201).json(newService);
  } catch (error) {
    console.error("Error creating service:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating service"
    });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const service = await db.query.services.findFirst({
      where: eq(services.id, Number(id))
    });
    
    if (!service) {
      return res.status(404).json({
        message: "Service not found"
      });
    }
    
    return res.status(200).json(service);
  } catch (error) {
    console.error("Error getting service:", error);
    return res.status(500).json({
      message: "Server error getting service"
    });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const serviceData = insertServiceSchema.parse(req.body);
    
    const existingService = await db.query.services.findFirst({
      where: eq(services.id, Number(id))
    });
    
    if (!existingService) {
      return res.status(404).json({
        message: "Service not found"
      });
    }
    
    // Check if service name already exists (not the same service)
    const duplicateService = await db.query.services.findFirst({
      where: eq(services.name, serviceData.name)
    });
    
    if (duplicateService && duplicateService.id !== Number(id)) {
      return res.status(400).json({
        message: "Service with this name already exists"
      });
    }
    
    const [updatedService] = await db.update(services)
      .set({
        ...serviceData,
        updatedAt: new Date()
      })
      .where(eq(services.id, Number(id)))
      .returning();
    
    return res.status(200).json(updatedService);
  } catch (error) {
    console.error("Error updating service:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error updating service"
    });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingService = await db.query.services.findFirst({
      where: eq(services.id, Number(id))
    });
    
    if (!existingService) {
      return res.status(404).json({
        message: "Service not found"
      });
    }
    
    // Check if service has bills or revenues or prices (this is enforced by the database, but let's check it first)
    const serviceBills = await db.query.bills.findMany({
      where: eq(bills.serviceId, Number(id))
    });
    
    if (serviceBills.length > 0) {
      return res.status(400).json({
        message: "Cannot delete service with existing bills"
      });
    }
    
    const serviceRevenues = await db.query.revenues.findMany({
      where: eq(revenues.serviceId, Number(id))
    });
    
    if (serviceRevenues.length > 0) {
      return res.status(400).json({
        message: "Cannot delete service with existing revenues"
      });
    }
    
    const servicePrices = await db.query.prices.findMany({
      where: eq(prices.serviceId, Number(id))
    });
    
    if (servicePrices.length > 0) {
      return res.status(400).json({
        message: "Cannot delete service with existing prices"
      });
    }
    
    await db.delete(services).where(eq(services.id, Number(id)));
    
    return res.status(200).json({
      message: "Service deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return res.status(500).json({
      message: "Server error deleting service"
    });
  }
};
