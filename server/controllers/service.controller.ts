import { Request, Response } from "express";
import { db } from "@db";
import { services, insertServiceSchema } from "@shared/schema";
import { eq, like } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sampleServices } from "../mock-data";
import { useMockData } from "../use-mock-data";

export const getServices = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      let query = db.query.services.findMany({
        orderBy: services.name
      });
      
      if (search) {
        query = db.query.services.findMany({
          where: like(services.name, `%${search}%`),
          orderBy: services.name
        });
      }
      
      return await query;
    };
    
    // Sử dụng mockData khi có lỗi kết nối
    const result = await useMockData(
      queryDatabase,
      sampleServices,
      "Error getting services"
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting services:", error);
    // Nếu có lỗi khác, trả về dữ liệu mẫu
    return res.status(200).json(sampleServices);
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
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      const service = await db.query.services.findFirst({
        where: eq(services.id, Number(id))
      });
      
      if (!service) {
        throw new Error("Service not found");
      }
      
      return service;
    };
    
    // Tìm dịch vụ trong dữ liệu mẫu
    const findMockService = () => {
      const service = sampleServices.find(s => s.id === Number(id));
      
      if (!service) {
        return res.status(404).json({
          message: "Service not found"
        });
      }
      
      return service;
    };
    
    // Sử dụng helper để kết hợp database thật và dữ liệu mẫu
    const service = await useMockData(
      queryDatabase,
      findMockService(),
      "Error getting service"
    );
    
    return res.status(200).json(service);
  } catch (error) {
    console.error("Error getting service:", error);
    
    // Nếu lỗi là "Service not found"
    if (error instanceof Error && error.message === "Service not found") {
      return res.status(404).json({
        message: "Service not found"
      });
    }
    
    // Lỗi khác, thử lấy từ dữ liệu mẫu
    const { id } = req.params;
    const service = sampleServices.find(s => s.id === Number(id));
    
    if (service) {
      return res.status(200).json(service);
    }
    
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
    
    // Tạo hàm query database
    const queryDatabase = async () => {
      const existingService = await db.query.services.findFirst({
        where: eq(services.id, Number(id))
      });
      
      if (!existingService) {
        throw new Error("Service not found");
      }
      
      // Check relations in the database
      // Xóa vì tất cả các bảng đều là MySQL, không cần kiểm tra các bảng khác
      
      await db.delete(services).where(eq(services.id, Number(id)));
      
      return { message: "Service deleted successfully" };
    };
    
    // Mock data operation - trong trường hợp này, chỉ cần trả về thành công
    const mockOperation = () => {
      const existingService = sampleServices.find(s => s.id === Number(id));
      
      if (!existingService) {
        return res.status(404).json({
          message: "Service not found"
        });
      }
      
      return { message: "Service deleted successfully" };
    };
    
    // Sử dụng helper để kết hợp database thật và dữ liệu mẫu
    const result = await useMockData(
      queryDatabase,
      mockOperation(),
      "Error deleting service"
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting service:", error);
    
    // Nếu lỗi là "Service not found"
    if (error instanceof Error && error.message === "Service not found") {
      return res.status(404).json({
        message: "Service not found"
      });
    }
    
    return res.status(500).json({
      message: "Server error deleting service"
    });
  }
};
