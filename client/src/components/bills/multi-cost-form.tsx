import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { costFormSchema } from "@shared/types";
import { Cost } from "@shared/types";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

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
    createCostsMutation.mutate(values);
  };

  const addNewCost = () => {
    append({
      billId,
      costTypeId: undefined as unknown as number,
      supplierId: undefined as unknown as number,
      amount: undefined as unknown as number,
      date: new Date(),
      notes: "",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <Card key={field.id} className="mb-4">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Chi phí #{index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`costs.${index}.costTypeId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại chi phí</FormLabel>
                      <Select
                        disabled={isLoadingCostTypes}
                        onValueChange={(value) => field.onChange(parseInt(value))}
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

                <FormField
                  control={form.control}
                  name={`costs.${index}.supplierId`}
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

                <FormField
                  control={form.control}
                  name={`costs.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tiền</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Nhập số tiền"
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

                <FormField
                  control={form.control}
                  name={`costs.${index}.date`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ngày</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                name={`costs.${index}.notes`}
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập ghi chú về chi phí này"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Thông tin thêm về chi phí (không bắt buộc)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <input 
                type="hidden" 
                {...form.register(`costs.${index}.billId`, { valueAsNumber: true })} 
                value={billId}
              />
            </CardContent>
          </Card>
        ))}

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addNewCost}
          >
            <Plus className="h-4 w-4 mr-2" /> Thêm chi phí khác
          </Button>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu tất cả chi phí"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
