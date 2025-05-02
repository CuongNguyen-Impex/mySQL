import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { costTypeAttributeFormSchema } from "@shared/types";
import { CostTypeAttribute } from "@shared/schema";

interface CostTypeAttributeFormProps {
  attribute?: CostTypeAttribute;
  onSuccess?: () => void;
  preSelectedCostTypeId?: number;
}

export default function CostTypeAttributeForm({
  attribute,
  onSuccess,
  preSelectedCostTypeId,
}: CostTypeAttributeFormProps) {
  const isEditing = !!attribute;

  // Set default values
  const defaultValues = attribute
    ? {
        ...attribute,
        costTypeId: attribute.costTypeId,
      }
    : {
        name: "",
        costTypeId: preSelectedCostTypeId || undefined,
      };

  const form = useForm({
    resolver: zodResolver(costTypeAttributeFormSchema),
    defaultValues,
  });

  // Fetch cost types
  const { data: costTypes = [] } = useQuery({
    queryKey: ["/api/cost-types"],
  });

  // Create or update attribute
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (isEditing) {
        return apiRequest(
          "PATCH",
          `/api/cost-type-attributes/${attribute.id}`,
          values
        );
      } else {
        return apiRequest("POST", "/api/cost-type-attributes", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/cost-type-attributes"],
      });
      if (onSuccess) onSuccess();
      if (!isEditing) {
        form.reset(defaultValues);
      }
    },
  });

  const onSubmit = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="costTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loại chi phí</FormLabel>
              <Select
                disabled={!!preSelectedCostTypeId || isEditing}
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
                  {costTypes.map((costType: any) => (
                    <SelectItem
                      key={costType.id}
                      value={costType.id.toString()}
                    >
                      {costType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Chọn loại chi phí mà thuộc tính này thuộc về
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên thuộc tính</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên thuộc tính" {...field} />
              </FormControl>
              <FormDescription>
                Ví dụ: Số chuyến, Số container, Số tấn, v.v.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {isEditing ? "Cập nhật thuộc tính" : "Thêm thuộc tính"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
