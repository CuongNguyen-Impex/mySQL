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
import { Calendar } from "@/components/ui/calendar";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { costFormSchema } from "@shared/types";
import { Cost, CostWithRelations } from "@shared/types";
import CostAttributeValueForm, { AttributeValueData } from "@/components/cost-types/cost-attribute-value-form";

interface CostFormProps {
  cost?: CostWithRelations;
  billId: number;
  onSuccess?: () => void;
}

export default function CostForm({ cost, billId, onSuccess }: CostFormProps) {
  const isEditing = !!cost;
  const [selectedCostTypeId, setSelectedCostTypeId] = useState<number | undefined>(cost?.costTypeId);
  const [attributeValues, setAttributeValues] = useState<AttributeValueData[]>([]);
  
  // Convert form default values
  const defaultValues = cost
    ? {
        ...cost,
        date: cost.date ? new Date(cost.date) : new Date(),
        amount: parseFloat(cost.amount.toString()),
      }
    : {
        billId,
        costTypeId: undefined,
        supplierId: undefined,
        amount: undefined,
        date: new Date(),
        notes: "",
      };

  const form = useForm({
    resolver: zodResolver(costFormSchema),
    defaultValues,
  });

  // Fetch cost types
  const { data: costTypes, isLoading: isLoadingCostTypes } = useQuery({
    queryKey: ["/api/cost-types"],
  });

  // Fetch suppliers
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });
  
  // Fetch attribute values for editing
  const { data: existingAttributeValues } = useQuery({
    queryKey: ["/api/cost-attribute-values", cost?.id],
    enabled: isEditing && !!cost?.id,
  });
  
  // Set initial attribute values when editing
  useEffect(() => {
    if (isEditing && existingAttributeValues?.length > 0) {
      const formattedValues = existingAttributeValues.map((av: any) => ({
        costTypeAttributeId: av.costTypeAttributeId,
        value: av.value,
      }));
      setAttributeValues(formattedValues);
    }
  }, [isEditing, existingAttributeValues]);

  // Create or update cost
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/costs/${cost.id}`, values);
      } else {
        return apiRequest("POST", "/api/costs", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bills/${billId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      if (onSuccess) onSuccess();
      form.reset(defaultValues);
    },
  });

  const onSubmit = (values: any) => {
    // Combine form values with attribute values
    const dataToSubmit = {
      ...values,
      attributeValues: attributeValues,
    };
    mutation.mutate(dataToSubmit);
  };
  
  // Handle cost type change
  const handleCostTypeChange = (costTypeId: number) => {
    setSelectedCostTypeId(costTypeId);
    form.setValue("costTypeId", costTypeId);
  };
  
  // Set initial cost type ID from form values
  useEffect(() => {
    if (form.getValues().costTypeId) {
      setSelectedCostTypeId(form.getValues().costTypeId);
    }
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="costTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Type</FormLabel>
                <Select
                  disabled={isLoadingCostTypes}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost type" />
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
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select
                  disabled={isLoadingSuppliers}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-7"
                      step="0.01"
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
                <FormLabel>Date</FormLabel>
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
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any notes about this cost"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional details about the cost
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <input type="hidden" {...form.register("billId", { valueAsNumber: true })} />
        
        {/* Cost Type Attributes */}
        <CostAttributeValueForm
          costTypeId={selectedCostTypeId}
          onAttributeValuesChange={setAttributeValues}
          initialValues={attributeValues}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {isEditing ? "Update Cost" : "Add Cost"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
