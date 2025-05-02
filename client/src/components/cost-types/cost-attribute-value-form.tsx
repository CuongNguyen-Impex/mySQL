import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CostTypeAttribute } from "@shared/schema";

interface CostAttributeValueFormProps {
  costTypeId?: number;
  onAttributeValuesChange: (attributeValues: AttributeValueData[]) => void;
  initialValues?: AttributeValueData[];
}

export interface AttributeValueData {
  costTypeAttributeId: number;
  value: string;
}

export default function CostAttributeValueForm({
  costTypeId,
  onAttributeValuesChange,
  initialValues = [],
}: CostAttributeValueFormProps) {
  const [attributeValues, setAttributeValues] = useState<AttributeValueData[]>(initialValues);

  // Fetch attributes for the selected cost type
  const { data: attributes = [], isLoading: isLoadingAttributes } = useQuery<CostTypeAttribute[]>({
    queryKey: ["/api/cost-type-attributes", costTypeId],
    enabled: !!costTypeId,
    select: (data) => {
      // Filter attributes for the selected cost type
      const filteredAttrs = data.filter((attr) => attr.costTypeId === costTypeId);
      
      // Make sure we prioritize important attributes
      return filteredAttrs.sort((a, b) => {
        const importantNames = ["Hóa đơn", "Trả hộ", "Ko hóa đơn"];
        const aIndex = importantNames.indexOf(a.name);
        const bIndex = importantNames.indexOf(b.name);
        
        // If both are important attributes, sort by their order in the array
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        // If only a is an important attribute, it comes first
        if (aIndex !== -1) return -1;
        // If only b is an important attribute, it comes first
        if (bIndex !== -1) return 1;
        // If neither are important attributes, keep original order
        return 0;
      });
    },
  });

  // Initialize attribute values when attributes change
  useEffect(() => {
    if (attributes.length > 0 && initialValues.length === 0) {
      // Create empty values for all attributes
      const newValues = attributes.map((attr) => ({
        costTypeAttributeId: attr.id,
        value: "",
      }));
      setAttributeValues(newValues);
      onAttributeValuesChange(newValues);
    } else if (initialValues.length > 0 && attributeValues.length === 0) {
      setAttributeValues(initialValues);
    }
  }, [attributes, initialValues, attributeValues.length, onAttributeValuesChange]);

  // Update attribute value
  const handleAttributeValueChange = (attributeId: number, value: string) => {
    const newValues = attributeValues.map((attr) =>
      attr.costTypeAttributeId === attributeId ? { ...attr, value } : attr
    );
    setAttributeValues(newValues);
    onAttributeValuesChange(newValues);
  };

  if (!costTypeId) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Please select a cost type first to see available attributes.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingAttributes) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (attributes.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No attributes defined for this cost type. Please add attributes in the cost type settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find the important attributes (Hóa đơn, Trả hộ, Ko hóa đơn)
  const importantAttrNames = ["Hóa đơn", "Trả hộ", "Ko hóa đơn"];
  const importantAttributes = attributes.filter(attr => 
    importantAttrNames.includes(attr.name)
  );

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Loại Chi Phí</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Chọn một loại</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {importantAttributes.map((attribute) => {
                    const attributeId = attribute.id;
                    const currentValue = attributeValues.find(
                      (av) => av.costTypeAttributeId === attributeId
                    )?.value || "";
                    // Set default for uninitialized attributes
                    if (attributeValues.length > 0 && !attributeValues.some(av => av.value === "true")) {
                      const defaultAttr = importantAttributes.find(attr => attr.name === "Hóa đơn");
                      if (defaultAttr && defaultAttr.id === attributeId) {
                        setTimeout(() => {
                          const updatedValues = attributeValues.map(item => 
                            item.costTypeAttributeId === attributeId 
                              ? { ...item, value: "true" } 
                              : item
                          );
                          setAttributeValues(updatedValues);
                          onAttributeValuesChange(updatedValues);
                        }, 100);
                      }
                    }
                    
                    const isSelected = currentValue === "true";
                    
                    return (
                      <div 
                        key={attributeId}
                        className={`border rounded-md p-3 cursor-pointer transition-all ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-md scale-105' : 'hover:bg-muted'}`}
                        onClick={() => {
                          // Set all attributes to false first
                          const newValues = importantAttributes.map(attr => ({
                            costTypeAttributeId: attr.id,
                            value: "false"
                          }));
                          
                          // Then set the selected one to true
                          const updatedValues = newValues.map(item => 
                            item.costTypeAttributeId === attributeId 
                              ? { ...item, value: "true" } 
                              : item
                          );
                          
                          setAttributeValues(updatedValues);
                          onAttributeValuesChange(updatedValues);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`${isSelected ? 'font-bold' : 'font-medium'}`}>{attribute.name}</div>
                          {isSelected && (
                            <div className="ml-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Other non-important attributes if any */}
            {attributes.filter(attr => !importantAttrNames.includes(attr.name)).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                <h4 className="text-sm font-medium col-span-full mb-2">Thuộc tính khác</h4>
                {attributes
                  .filter(attr => !importantAttrNames.includes(attr.name))
                  .map((attribute) => {
                    const currentValue = attributeValues.find(
                      (av) => av.costTypeAttributeId === attribute.id
                    )?.value || "";
                    
                    return (
                      <div key={attribute.id} className="space-y-2">
                        <Label htmlFor={`attribute-${attribute.id}`}>{attribute.name}</Label>
                        <Select
                          value={currentValue}
                          onValueChange={(value) =>
                            handleAttributeValueChange(attribute.id, value)
                          }
                        >
                          <SelectTrigger id={`attribute-${attribute.id}`}>
                            <SelectValue placeholder={`Select ${attribute.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Không xác định --</SelectItem>
                            <SelectItem value="true">Có</SelectItem>
                            <SelectItem value="false">Không</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
