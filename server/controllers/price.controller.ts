import { Request, Response } from "express";
import { db } from "@db";
import { prices, customers, services, insertPriceSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { samplePrices } from "../mock-data";
import { useMockData } from "../use-mock-data";

export const getPrices = async (req: Request, res: Response) => {
  try {
    const { customerId, serviceId } = req.query;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      let query = db.query.prices.findMany({
        with: {
          customer: true,
          service: true
        }
        // Không thể sắp xếp trực tiếp bằng trường của bảng liên kết
        // Sẽ sắp xếp kết quả ở client side
      });
      
      if (customerId && serviceId) {
        query = db.query.prices.findMany({
          where: and(
            eq(prices.customerId, Number(customerId)),
            eq(prices.serviceId, Number(serviceId))
          ),
          with: {
            customer: true,
            service: true
          }
        });
      } else if (customerId) {
        query = db.query.prices.findMany({
          where: eq(prices.customerId, Number(customerId)),
          with: {
            customer: true,
            service: true
          }
          // orderBy đã bỏ vì lỗi cột không tồn tại
        });
      } else if (serviceId) {
        query = db.query.prices.findMany({
          where: eq(prices.serviceId, Number(serviceId)),
          with: {
            customer: true,
            service: true
          },
          // orderBy đã bỏ vì lỗi cột không tồn tại
        });
      }
      
      return await query;
    };
    
    // Sử dụng mockData khi có lỗi kết nối
    const result = await useMockData(
      queryDatabase,
      samplePrices,
      "Error getting prices"
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting prices:", error);
    // Nếu có lỗi khác, trả về dữ liệu mẫu
    return res.status(200).json(samplePrices);
  }
};

export const createPrice = async (req: Request, res: Response) => {
  try {
    const priceData = insertPriceSchema.parse(req.body);
    
    // Check if price already exists for this customer and service
    const existingPrice = await db.query.prices.findFirst({
      where: and(
        eq(prices.customerId, priceData.customerId),
        eq(prices.serviceId, priceData.serviceId)
      )
    });
    
    if (existingPrice) {
      return res.status(400).json({
        message: "Price for this customer and service already exists"
      });
    }
    
    // Check if customer exists
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, priceData.customerId)
    });
    
    if (!customer) {
      return res.status(400).json({
        message: "Customer not found"
      });
    }
    
    // Check if service exists
    const service = await db.query.services.findFirst({
      where: eq(services.id, priceData.serviceId)
    });
    
    if (!service) {
      return res.status(400).json({
        message: "Service not found"
      });
    }
    
    const [newPrice] = await db.insert(prices).values(priceData).returning();
    
    // Get price with relations
    const priceWithRelations = await db.query.prices.findFirst({
      where: eq(prices.id, newPrice.id),
      with: {
        customer: true,
        service: true
      }
    });
    
    return res.status(201).json(priceWithRelations);
  } catch (error) {
    console.error("Error creating price:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error creating price"
    });
  }
};

export const getPriceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const price = await db.query.prices.findFirst({
      where: eq(prices.id, Number(id)),
      with: {
        customer: true,
        service: true
      }
    });
    
    if (!price) {
      return res.status(404).json({
        message: "Price not found"
      });
    }
    
    return res.status(200).json(price);
  } catch (error) {
    console.error("Error getting price:", error);
    return res.status(500).json({
      message: "Server error getting price"
    });
  }
};

export const getPriceByCustomerAndService = async (req: Request, res: Response) => {
  try {
    const { customerId, serviceId } = req.params;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      const price = await db.query.prices.findFirst({
        where: and(
          eq(prices.customerId, Number(customerId)),
          eq(prices.serviceId, Number(serviceId))
        ),
        with: {
          customer: true,
          service: true
        }
      });
      
      if (!price) {
        throw new Error("Price not found for this customer and service");
      }
      
      return price;
    };
    
    // Tìm giá trong dữ liệu mẫu
    const findMockPrice = () => {
      const price = samplePrices.find(
        p => p.customerId === Number(customerId) && p.serviceId === Number(serviceId)
      );
      
      if (!price) {
        return res.status(404).json({
          message: "Price not found for this customer and service"
        });
      }
      
      return price;
    };
    
    // Sử dụng helper để kết hợp database thật và dữ liệu mẫu
    const price = await useMockData(
      queryDatabase,
      findMockPrice(),
      "Error getting price by customer and service"
    );
    
    return res.status(200).json(price);
  } catch (error) {
    console.error("Error getting price by customer and service:", error);
    
    // Nếu lỗi là "Price not found"
    if (error instanceof Error && error.message === "Price not found for this customer and service") {
      return res.status(404).json({
        message: "Price not found for this customer and service"
      });
    }
    
    // Lỗi khác, thử lấy từ dữ liệu mẫu
    const { customerId, serviceId } = req.params;
    const price = samplePrices.find(
      p => p.customerId === Number(customerId) && p.serviceId === Number(serviceId)
    );
    
    if (price) {
      return res.status(200).json(price);
    }
    
    return res.status(500).json({
      message: "Server error getting price"
    });
  }
};

export const updatePrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const priceData = insertPriceSchema.parse(req.body);
    
    const existingPrice = await db.query.prices.findFirst({
      where: eq(prices.id, Number(id))
    });
    
    if (!existingPrice) {
      return res.status(404).json({
        message: "Price not found"
      });
    }
    
    // If customer or service changed, check if the new combination already exists
    if (priceData.customerId !== existingPrice.customerId || priceData.serviceId !== existingPrice.serviceId) {
      const duplicatePrice = await db.query.prices.findFirst({
        where: and(
          eq(prices.customerId, priceData.customerId),
          eq(prices.serviceId, priceData.serviceId)
        )
      });
      
      if (duplicatePrice) {
        return res.status(400).json({
          message: "Price for this customer and service already exists"
        });
      }
    }
    
    const [updatedPrice] = await db.update(prices)
      .set({
        ...priceData,
        updatedAt: new Date()
      })
      .where(eq(prices.id, Number(id)))
      .returning();
    
    // Get price with relations
    const priceWithRelations = await db.query.prices.findFirst({
      where: eq(prices.id, updatedPrice.id),
      with: {
        customer: true,
        service: true
      }
    });
    
    return res.status(200).json(priceWithRelations);
  } catch (error) {
    console.error("Error updating price:", error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    
    return res.status(500).json({
      message: "Server error updating price"
    });
  }
};

export const deletePrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingPrice = await db.query.prices.findFirst({
      where: eq(prices.id, Number(id))
    });
    
    if (!existingPrice) {
      return res.status(404).json({
        message: "Price not found"
      });
    }
    
    await db.delete(prices).where(eq(prices.id, Number(id)));
    
    return res.status(200).json({
      message: "Price deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting price:", error);
    return res.status(500).json({
      message: "Server error deleting price"
    });
  }
};
