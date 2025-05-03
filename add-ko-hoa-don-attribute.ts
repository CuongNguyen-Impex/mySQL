import { db } from "./db";
import * as schema from "./shared/schema.mysql";
import { eq } from "drizzle-orm";

const { costTypes, costTypeAttributes } = schema;

async function addKoHoaDonAttributes() {
  try {
    console.log("Adding 'Ko hóa đơn' attributes...");
    
    // Get existing cost types
    const existingCostTypes = await db.select().from(costTypes).execute();
    
    if (existingCostTypes.length > 0) {
      const koHoaDonAttributesData = [];
      
      // Add 'Ko hóa đơn' attribute to each existing cost type
      for (const costType of existingCostTypes) {
        // Check if this cost type already has a 'Ko hóa đơn' attribute
        const existingAttribute = await db.select()
          .from(costTypeAttributes)
          .where(
            eq(costTypeAttributes.costTypeId, costType.id)
          )
          .execute();
        
        // Filter client-side since MySQL syntax is different
        const filtered = existingAttribute.filter(attr => attr.name === "Ko hóa đơn");
        
        // Only add if it doesn't exist
        if (filtered.length === 0) {
          koHoaDonAttributesData.push({
            costTypeId: costType.id,
            name: "Ko hóa đơn"
          });
        }
      }
      
      if (koHoaDonAttributesData.length > 0) {
        const result = await db.insert(costTypeAttributes).values(koHoaDonAttributesData);
        console.log(`✅ Added ${koHoaDonAttributesData.length} 'Ko hóa đơn' attributes`);
      } else {
        console.log("ℹ️ All cost types already have 'Ko hóa đơn' attributes");
      }
    }
    
    console.log("Completed adding 'Ko hóa đơn' attributes.");
  } catch (error) {
    console.error("Error adding 'Ko hóa đơn' attributes:", error);
  }
}

addKoHoaDonAttributes();
