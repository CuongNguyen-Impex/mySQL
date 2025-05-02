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
  costTypeAttributeId: number; // ID của thuộc tính
  value: string; // Giá trị của thuộc tính
}

export default function CostAttributeValueForm({
  costTypeId,
  onAttributeValuesChange,
  initialValues = [],
}: CostAttributeValueFormProps) {
  const [attributeValues, setAttributeValues] = useState<AttributeValueData[]>(initialValues);
  
  // Debug logging
  useEffect(() => {
    console.log("CostAttributeValueForm props:", { costTypeId, initialValues });
    console.log("Current attributeValues:", attributeValues);
  }, [costTypeId, initialValues, attributeValues]);

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

  // Combine initialValues with existing attributes
  useEffect(() => {
    if (attributes.length > 0) {
      // Tạo một đối tượng để theo dõi tất cả thuộc tính đã tồn tại trong initialValues
      const existingAttrMap: Record<number, AttributeValueData> = {};
      
      // Lấy tất cả thuộc tính từ initialValues
      if (initialValues.length > 0) {
        initialValues.forEach(val => {
          existingAttrMap[val.costTypeAttributeId] = val;
        });
      }
      
      // Tạo mảng attribute values mới bao gồm tất cả thuộc tính cần thiết
      const newAttrValues: AttributeValueData[] = [];
      
      // Đảm bảo rằng chúng ta có một giá trị cho mỗi thuộc tính
      attributes.forEach(attr => {
        if (existingAttrMap[attr.id]) {
          // Sử dụng giá trị hiện có nếu có
          newAttrValues.push(existingAttrMap[attr.id]);
        } else {
          // Nếu không, tạo một giá trị mới với giá trị rỗng
          newAttrValues.push({
            costTypeAttributeId: attr.id,
            value: ""
          });
        }
      });
      
      // Cập nhật state nếu có sự thay đổi
      if (JSON.stringify(newAttrValues) !== JSON.stringify(attributeValues)) {
        console.log("Cập nhật thuộc tính từ API:", newAttrValues);
        setAttributeValues(newAttrValues);
        
        // Đảm bảo luôn có một giá trị được chọn trong các thuộc tính quan trọng
        const importantAttrs = attributes.filter(attr => 
          ["Hóa đơn", "Trả hộ", "Ko hóa đơn"].includes(attr.name)
        );
        
        // Kiểm tra xem đã có thuộc tính quan trọng nào được chọn chưa
        const hasSelectedImportant = newAttrValues.some(val => {
          const attrId = val.costTypeAttributeId;
          const isImportant = importantAttrs.some(attr => attr.id === attrId);
          return isImportant && val.value === "true";
        });
        
        // Nếu chưa có thuộc tính quan trọng nào được chọn, chọn mặc định "Hóa đơn"
        if (importantAttrs.length > 0 && !hasSelectedImportant) {
          const defaultAttr = importantAttrs.find(attr => attr.name === "Hóa đơn") || importantAttrs[0];
          
          // Tạo bản sao của mảng giá trị mới
          const updatedValues = [...newAttrValues];
          
          // Cập nhật tất cả các thuộc tính quan trọng thành false
          updatedValues.forEach((val, index) => {
            const isImportant = importantAttrs.some(attr => attr.id === val.costTypeAttributeId);
            if (isImportant) {
              updatedValues[index] = { ...val, value: "false" };
            }
          });
          
          // Cập nhật thuộc tính mặc định thành true
          const defaultIndex = updatedValues.findIndex(val => val.costTypeAttributeId === defaultAttr.id);
          if (defaultIndex !== -1) {
            updatedValues[defaultIndex] = { ...updatedValues[defaultIndex], value: "true" };
          }
          
          console.log("Đặt thuộc tính mặc định:", updatedValues);
          setAttributeValues(updatedValues);
          onAttributeValuesChange(updatedValues);
        } else {
          // Nếu đã có thuộc tính được chọn, chỉ cần cập nhật danh sách
          onAttributeValuesChange(newAttrValues);
        }
      }
    }
  }, [attributes, initialValues, attributeValues, onAttributeValuesChange]);

  // Cập nhật giá trị thuộc tính
  const handleAttributeValueChange = (attributeId: number, value: string) => {
    const newValues = attributeValues.map((attr) =>
      attr.costTypeAttributeId === attributeId ? { ...attr, value } : attr
    );
    
    setAttributeValues(newValues);
    onAttributeValuesChange(newValues);
  };

  // Xử lý khi chọn thuộc tính quan trọng
  const handleImportantAttributeSelection = (attributeId: number) => {
    // Tìm các thuộc tính quan trọng
    const importantAttrNames = ["Hóa đơn", "Trả hộ", "Ko hóa đơn"];
    const importantAttributes = attributes.filter(attr => 
      importantAttrNames.includes(attr.name)
    );
    
    // Chuẩn bị mảng giá trị mới
    const updatedValues = [...attributeValues];
    
    // Đặt tất cả thuộc tính quan trọng thành false
    updatedValues.forEach((val, index) => {
      const isImportant = importantAttributes.some(attr => attr.id === val.costTypeAttributeId);
      if (isImportant) {
        updatedValues[index] = { ...val, value: "false" };
      }
    });
    
    // Đặt thuộc tính được chọn thành true
    const selectedIndex = updatedValues.findIndex(val => val.costTypeAttributeId === attributeId);
    if (selectedIndex !== -1) {
      updatedValues[selectedIndex] = { ...updatedValues[selectedIndex], value: "true" };
    }
    
    console.log("Chọn thuộc tính:", updatedValues);
    setAttributeValues(updatedValues);
    onAttributeValuesChange(updatedValues);
  };

  if (!costTypeId) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Vui lòng chọn loại chi phí trước để xem các thuộc tính.
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
            Không có thuộc tính nào cho loại chi phí này. Vui lòng thêm thuộc tính trong cài đặt loại chi phí.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Tìm các thuộc tính quan trọng (Hóa đơn, Trả hộ, Ko hóa đơn)
  const importantAttrNames = ["Hóa đơn", "Trả hộ", "Ko hóa đơn"];
  const importantAttributes = attributes.filter(attr => 
    importantAttrNames.includes(attr.name)
  );

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Phân Loại Chi Phí</h3>
          <div className="space-y-6">
            {importantAttributes.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Chọn một loại</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {importantAttributes.map((attribute) => {
                      const attributeId = attribute.id;
                      const attrValue = attributeValues.find(
                        (av) => av.costTypeAttributeId === attributeId
                      );
                      
                      const isSelected = attrValue?.value === "true";
                      
                      return (
                        <div 
                          key={attributeId}
                          className={`border rounded-md p-3 cursor-pointer transition-all ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-md scale-105' : 'hover:bg-muted'}`}
                          onClick={() => handleImportantAttributeSelection(attributeId)}
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
            )}
            
            {/* Các thuộc tính khác */}
            {attributes.filter(attr => !importantAttrNames.includes(attr.name)).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                <h4 className="text-sm font-medium col-span-full mb-2">Thuộc tính khác</h4>
                {attributes
                  .filter(attr => !importantAttrNames.includes(attr.name))
                  .map((attribute) => {
                    const attrValue = attributeValues.find(
                      (av) => av.costTypeAttributeId === attribute.id
                    );
                    const currentValue = attrValue?.value || "";
                    
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
                            <SelectValue placeholder={`Chọn ${attribute.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="undefined">-- Không xác định --</SelectItem>
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
