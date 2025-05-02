import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { costFormSchema } from "@shared/types";
import { Cost } from "@shared/types";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

interface AttributeValue {
  costTypeAttributeId: number;
  value: string;
}

interface CostFormData {
  billId: number;
  costTypeId: number;
  supplierId: number;
  amount: number;
  date: Date;
  notes: string;
  attributeValues?: AttributeValue[];
}

// Define a schema for multiple costs
const multiCostFormSchema = z.object({
  costs: z.array(
    z.object({
      billId: z.number(),
      costTypeId: z.number(),
      supplierId: z.number(),
      amount: z.number().positive("Amount must be greater than 0"),
      date: z.date(),
      notes: z.string().optional(),
      attributeValues: z.array(
        z.object({
          costTypeAttributeId: z.number(),
          value: z.string()
        })
      ).optional()
    })
  ),
});

interface MultiCostFormProps {
  billId: number;
  onSuccess?: () => void;
}

export default function MultiCostForm({ billId, onSuccess }: MultiCostFormProps) {

  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  // Hiển thị các thuộc tính đã chọn với badge màu xanh
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, AttributeValue[]>>({});
  
  // Theo dõi quá trình debug bằng console
  useEffect(() => {
    console.log("Current selectedAttributes state:", selectedAttributes);
  }, [selectedAttributes]);

  // Form setup with useFieldArray for handling multiple entries
  const form = useForm({
    resolver: zodResolver(multiCostFormSchema),
    defaultValues: {
      costs: [
        {
          billId,
          costTypeId: undefined as unknown as number,
          supplierId: undefined as unknown as number,
          amount: undefined as unknown as number,
          date: new Date(),
          notes: "",
          attributeValues: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "costs",
  });

  // Fetch cost types
  const { data: costTypes, isLoading: isLoadingCostTypes } = useQuery({
    queryKey: ["/api/cost-types"],
  });

  // Fetch suppliers
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Mutation for submitting multiple costs
  const createCostsMutation = useMutation({
    mutationFn: async (values: { costs: any[] }) => {
      // Create an array of promises for each cost creation
      const promises = values.costs.map(cost => 
        apiRequest("POST", "/api/costs", cost)
      );
      // Wait for all costs to be created
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bills/${billId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Chi phí đã được thêm",
        description: `Đã thêm thành công ${fields.length} chi phí vào hóa đơn`,
      });
      // Reset form and call onSuccess
      form.reset({
        costs: [
          {
            billId,
            costTypeId: undefined as unknown as number,
            supplierId: undefined as unknown as number,
            amount: undefined as unknown as number,
            date: new Date(),
            notes: "",
          },
        ],
      });
      setSubmitting(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Error adding costs:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm chi phí. Vui lòng thử lại.",
        variant: "destructive",
      });
      setSubmitting(false);
    },
  });

  const onSubmit = async (values: z.infer<typeof multiCostFormSchema>) => {
    setSubmitting(true);
    // Make sure each cost has the attribute values from our state
    const costsWithAttributes = values.costs.map((cost, index) => {
      if (selectedAttributes[index]) {
        return {
          ...cost,
          attributeValues: selectedAttributes[index]
        };
      }
      return cost;
    });
    
    console.log("Submitting costs with attributes:", costsWithAttributes);
    createCostsMutation.mutate({ costs: costsWithAttributes });
  };

  // Get attributes for the selected cost type
  const { data: costTypeAttributes = [] } = useQuery<any[]>({
    queryKey: ["/api/cost-type-attributes"],
  });

  // Process cost type selection to fetch attributes
  const handleCostTypeChange = (value: string, index: number) => {
    const costTypeId = parseInt(value);
    form.setValue(`costs.${index}.costTypeId`, costTypeId);
    
    // Get attributes for this cost type
    const attributes = costTypeAttributes.filter((attr: any) => attr.costTypeId === costTypeId);
    console.log("Available attributes:", attributes);
    
    // Set default attribute (Hóa đơn if exists)
    if (attributes.length > 0) {
      const defaultAttr = attributes.find((attr: any) => attr.name === "Hóa đơn") || attributes[0];
      console.log("Selected default attribute:", defaultAttr);
      
      // Create attribute value object
      const attributeValue: AttributeValue = {
        costTypeAttributeId: defaultAttr.id,
        value: defaultAttr.name
      };
      
      // Update form and state
      const attrValues = [attributeValue];
      form.setValue(`costs.${index}.attributeValues`, attrValues);
      
      // Update the selected attributes state
      setSelectedAttributes(prev => {
        const updated = {
          ...prev,
          [index]: attrValues
        };
        console.log("Updated selected attributes:", updated);
        return updated;
      });
    }
  };

  const addNewCost = () => {
    append({
      billId,
      costTypeId: undefined as unknown as number,
      supplierId: undefined as unknown as number,
      amount: undefined as unknown as number,
      date: new Date(),
      notes: "",
      attributeValues: [],
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="overflow-x-auto border rounded-md max-w-full w-full" style={{ minWidth: "1000px" }}>
          <table className="w-full border-collapse">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-3 font-medium w-[50px]">STT</th>
                <th className="p-3 font-medium w-[150px]">Loại chi phí</th>
                <th className="p-3 font-medium w-[150px]">Nhà cung cấp</th>
                <th className="p-3 font-medium w-[100px]">Số tiền</th>
                <th className="p-3 font-medium w-[120px]">Ngày tháng</th>
                <th className="p-3 font-medium w-[450px]">Ghi chú</th>
                <th className="p-3 font-medium w-[50px]">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 align-top pt-4">{index + 1}</td>
                  <td className="p-3 align-top">
                    <FormField
                      control={form.control}
                      name={`costs.${index}.costTypeId`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <Select
                            disabled={isLoadingCostTypes}
                            onValueChange={(value) => handleCostTypeChange(value, index)}
                            value={field.value?.toString()}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại chi phí" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {costTypes?.map((costType: any) => (
                                <SelectItem
                                  key={costType.id}
                                  value={costType.id.toString()}
                                >
                                  {costType.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="p-3 align-top">
                    <FormField
                      control={form.control}
                      name={`costs.${index}.supplierId`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <Select
                            disabled={isLoadingSuppliers}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn nhà cung cấp" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers?.map((supplier: any) => (
                                <SelectItem
                                  key={supplier.id}
                                  value={supplier.id.toString()}
                                >
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="p-3 align-top">
                    <FormField
                      control={form.control}
                      name={`costs.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Nhập số tiền"
                              className="w-[120px]"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="p-3 align-top">
                    <FormField
                      control={form.control}
                      name={`costs.${index}.date`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-[120px] pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Chọn ngày</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="p-3 align-top">
                    <FormField
                      control={form.control}
                      name={`costs.${index}.notes`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Textarea
                              placeholder="Ghi chú"
                              className="min-h-[100px] w-full"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <input 
                      type="hidden" 
                      {...form.register(`costs.${index}.billId`, { valueAsNumber: true })} 
                      value={billId}
                    />
                    <div className="mt-2">
                      {selectedAttributes[index]?.map((attr, attrIndex) => (
                        <Badge key={attrIndex} variant="outline" className="mr-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 font-medium border-green-300 dark:border-green-700">
                          {attr.value}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 align-top text-center">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} className="p-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addNewCost}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm dòng mới
                  </Button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu tất cả chi phí"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
