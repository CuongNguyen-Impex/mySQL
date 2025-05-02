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
import { Spinner } from "@/components/ui/spinner";
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
    select: (data) => data.filter((attr) => attr.costTypeId === costTypeId),
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
          <Spinner />
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

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Cost Type Attributes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attributes.map((attribute) => {
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
                      <SelectItem value="">-- Not specified --</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
