import React from "react";
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
import { revenueFormSchema } from "@shared/types";
import { Revenue } from "@shared/types";

interface RevenueFormProps {
  revenue?: Revenue;
  billId: number;
  customerId?: number;
  onSuccess?: () => void;
}

export default function RevenueForm({ revenue, billId, customerId, onSuccess }: RevenueFormProps) {
  const isEditing = !!revenue;
  
  // Convert form default values
  const defaultValues = revenue
    ? {
        ...revenue,
        date: revenue.date ? new Date(revenue.date) : new Date(),
        amount: parseFloat(revenue.amount.toString()),
      }
    : {
        billId,
        serviceId: undefined,
        amount: undefined,
        date: new Date(),
        notes: "",
      };

  const form = useForm({
    resolver: zodResolver(revenueFormSchema),
    defaultValues,
  });

  // Fetch services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/services"],
  });

  // Fetch price if customerId and serviceId are available
  const serviceId = form.watch("serviceId");
  const { data: priceData } = useQuery({
    queryKey: ["/api/prices", customerId, serviceId],
    enabled: !!(customerId && serviceId),
  });

  // If price is available, set the amount
  React.useEffect(() => {
    if (priceData?.price && !isEditing && !form.getValues("amount")) {
      form.setValue("amount", parseFloat(priceData.price));
    }
  }, [priceData, form, isEditing]);

  // Create or update revenue
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/revenues/${revenue.id}`, values);
      } else {
        return apiRequest("POST", "/api/revenues", values);
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
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service</FormLabel>
                <Select
                  disabled={isLoadingServices}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services?.map((service: any) => (
                      <SelectItem
                        key={service.id}
                        value={service.id.toString()}
                      >
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customerId && serviceId && priceData?.price && (
                  <FormDescription>
                    Standard price: ${parseFloat(priceData.price).toFixed(2)}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any notes about this revenue"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional details about the revenue
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <input type="hidden" {...form.register("billId", { valueAsNumber: true })} />

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {isEditing ? "Update Revenue" : "Add Revenue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
