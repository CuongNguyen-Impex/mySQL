import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { costFormSchema } from "@shared/types";
import { Cost, CostWithRelations } from "@shared/types";
import CostAttributeValueForm, { AttributeValueData } from "@/components/cost-types/cost-attribute-value-form";
import { Badge } from "@/components/ui/badge";

interface CostFormProps {
  cost?: CostWithRelations;
  billId: number;
  onSuccess?: () => void;
}

export default function CostForm({ cost, billId, onSuccess }: CostFormProps) {
  const isEditing = !!cost;
  const [selectedCostTypeId, setSelectedCostTypeId] = useState<number | undefined>(cost?.costTypeId);
  const [attributeValues, setAttributeValues] = useState<AttributeValueData[]>([]);
  const { toast } = useToast();
  
  // Thông tin mặc định cho form
  const defaultValues = {
    billId: billId,
    costTypeId: cost?.costTypeId,
    supplierId: cost?.supplierId,
    amount: cost ? parseFloat(cost.amount.toString()) : undefined,
    date: cost?.date ? new Date(cost.date) : new Date(),
    notes: cost?.notes ?? "",
  };

  // Khởi tạo form với các giá trị mặc định
  const form = useForm({
    resolver: zodResolver(costFormSchema),
    defaultValues,
  });

  // Lấy danh sách loại chi phí
  const { data: costTypes = [], isLoading: isLoadingCostTypes } = useQuery({
    queryKey: ["/api/cost-types"],
  });

  // Lấy danh sách nhà cung cấp
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });
  
  // Lấy thuộc tính của chi phí khi chỉnh sửa
  const { data: existingAttributesData } = useQuery({
    queryKey: ["/api/cost-attribute-values", cost?.id],
    enabled: isEditing && !!cost?.id,
  });
  
  // Cập nhật giá trị của thuộc tính khi chỉnh sửa
  useEffect(() => {
    if (isEditing && existingAttributesData && Array.isArray(existingAttributesData) && existingAttributesData.length > 0) {
      // Chuyển đổi dữ liệu từ server về định dạng của form
      const formattedValues = existingAttributesData.map((attr: any) => ({
        costTypeAttributeId: attr.attributeId,
        value: attr.value,
      }));
      
      console.log("Thuộc tính chi phí hiện tại:", formattedValues);
      setAttributeValues(formattedValues);
    }
  }, [isEditing, existingAttributesData]);

  // Xử lý khi thay đổi loại chi phí
  const handleCostTypeChange = (costTypeId: number) => {
    setSelectedCostTypeId(costTypeId);
    form.setValue("costTypeId", costTypeId);
    
    // Reset thuộc tính khi thay đổi loại chi phí
    setAttributeValues([]);
  };
  
  // Đồng bộ hóa costTypeId khi form được khởi tạo
  useEffect(() => {
    const currentCostTypeId = form.getValues().costTypeId;
    if (currentCostTypeId) {
      setSelectedCostTypeId(currentCostTypeId);
    }
  }, [form]);

  // Mutation để tạo/cập nhật chi phí
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (isEditing && cost?.id) {
        console.log(`Đang cập nhật chi phí ${cost.id} với dữ liệu:`, values);
        return apiRequest("PATCH", `/api/costs/${cost.id}`, values);
      } else {
        console.log("Đang tạo chi phí mới với dữ liệu:", values);
        return apiRequest("POST", "/api/costs", values);
      }
    },
    onSuccess: () => {
      // Cập nhật dữ liệu
      queryClient.invalidateQueries({ queryKey: [`/api/bills/${billId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/by-customer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/by-supplier"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
      
      // Thông báo thành công
      toast({
        title: isEditing ? "Cập nhật thành công!" : "Đã thêm chi phí!",
        description: "Dữ liệu đã được lưu vào cơ sở dữ liệu.",
        variant: "success",
      });
      
      // Gọi callback nếu có
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error("Lỗi khi lưu chi phí:", error);
      toast({
        title: "Có lỗi xảy ra",
        description: error?.message || "Không thể lưu chi phí. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  // Xử lý khi submit form
  const onSubmit = (values: any) => {
    // Chuyển đổi amount thành chuỗi vì backend mong đợi kiểu string
    const formattedValues = {
      ...values,
      amount: values.amount?.toString() || "0",
    };
    
    // Kết hợp giá trị form với thuộc tính
    const dataToSubmit = {
      ...formattedValues,
      attributeValues: attributeValues,
    };
    
    console.log("Gửi dữ liệu chi phí:", dataToSubmit);
    mutation.mutate(dataToSubmit);
  };
  
  // Hiển thị danh sách thuộc tính đã chọn
  const selectedAttributes = attributeValues
    .filter(attr => attr.value === "true")
    .map(attr => {
      // Tìm tên thuộc tính từ costTypeId và id thuộc tính
      let attributeName = 'Unknown';
      if (Array.isArray(costTypes)) {
        // Truy vấn từ danh sách loại chi phí và thuộc tính
        for (const ct of costTypes) {
          if (ct.attributes && Array.isArray(ct.attributes)) {
            const found = ct.attributes.find((a: any) => a.id === attr.costTypeAttributeId);
            if (found) {
              attributeName = found.name;
              break;
            }
          }
        }
      }
      return attributeName;
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="costTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại chi phí</FormLabel>
                <Select
                  disabled={isLoadingCostTypes}
                  onValueChange={(value) => {
                    const numValue = parseInt(value);
                    field.onChange(numValue);
                    handleCostTypeChange(numValue);
                  }}
                  value={field.value?.toString()}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại chi phí" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(costTypes) && costTypes.map((costType: any) => (
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

          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nhà cung cấp</FormLabel>
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
                    {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số tiền</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                      ₫
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-7"
                      step="1"
                      min="0"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "0" : e.target.value;
                        field.onChange(parseFloat(value));
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ngày</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
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
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Thêm ghi chú về chi phí này"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                {selectedAttributes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAttributes.map((attrName, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                        {attrName}
                      </Badge>
                    ))}
                  </div>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <input type="hidden" {...form.register("billId", { valueAsNumber: true })} />
        
        {/* Thuộc tính của loại chi phí */}
        {selectedCostTypeId && (
          <CostAttributeValueForm
            costTypeId={selectedCostTypeId}
            onAttributeValuesChange={setAttributeValues}
            initialValues={attributeValues}
          />
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {isEditing ? "Cập nhật chi phí" : "Thêm chi phí"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
