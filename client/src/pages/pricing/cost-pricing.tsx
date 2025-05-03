import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MoreHorizontal, X, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { costPriceFormSchema } from "@shared/types";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// Define types for our data
type Customer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

type Service = {
  id: number;
  name: string;
  unit?: string;
  description?: string;
};

type CostType = {
  id: number;
  name: string;
  description?: string;
};

type CostPrice = {
  id: number;
  customerId: number;
  serviceId: number;
  costTypeId: number;
  price: string;
  createdAt?: string;
  updatedAt?: string;
  costType?: {
    id: number;
    name: string;
  };
};

export default function CostPricing() {
  const { toast } = useToast();
  
  // State for selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // State for dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // State for selecting items
  const [selectedCostPrice, setSelectedCostPrice] = useState<CostPrice | null>(null);
  const [costPriceToDelete, setCostPriceToDelete] = useState<{id: number} | null>(null);
  
  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch services
  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Fetch cost types
  const { data: costTypes, isLoading: isLoadingCostTypes } = useQuery<CostType[]>({
    queryKey: ["/api/cost-types"],
  });

  // Fetch cost prices for the selected customer and service
  const { 
    data: costPrices, 
    isLoading: isLoadingCostPrices,
    refetch: refetchCostPrices 
  } = useQuery<CostPrice[]>({
    queryKey: ["/api/cost-prices/customer", selectedCustomerId, "/service", selectedServiceId],
    queryFn: async () => {
      if (!selectedCustomerId || !selectedServiceId) return [];
      const res = await apiRequest(
        "GET", 
        `/api/cost-prices/customer/${selectedCustomerId}/service/${selectedServiceId}`
      );
      return res.json();
    },
    enabled: !!selectedCustomerId && !!selectedServiceId,
  });

  // Define types for form values
  type CostPriceFormValues = {
    customerId: number;
    serviceId: number;
    prices: {
      costTypeId: number;
      price: string;
    }[];
  }

  // Setup form
  const form = useForm<CostPriceFormValues>({
    resolver: zodResolver(costPriceFormSchema),
    defaultValues: {
      customerId: selectedCustomerId || 0,
      serviceId: selectedServiceId || 0,
      prices: [
        { costTypeId: 0, price: "" }
      ]
    }
  });
  
  // Setup field array for multiple cost prices
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "prices"
  });

  // Update form default values when selections change
  useEffect(() => {
    if (selectedCustomerId && selectedServiceId) {
      form.setValue("customerId", selectedCustomerId);
      form.setValue("serviceId", selectedServiceId);
    }
  }, [selectedCustomerId, selectedServiceId, form]);

  // Reset form when dialog opens/closes or when selectedCostPrice changes
  useEffect(() => {
    if (isFormDialogOpen) {
      if (selectedCostPrice) {
        form.setValue("customerId", selectedCostPrice.customerId);
        form.setValue("serviceId", selectedCostPrice.serviceId);
        form.setValue("prices", [{
          costTypeId: selectedCostPrice.costTypeId,
          price: selectedCostPrice.price
        }]);
      } else {
        // For new cost price, pre-fill unpriced cost types
        const existingCostTypeIds = Array.isArray(costPrices) 
          ? costPrices.map(cp => cp.costTypeId) 
          : [];
          
        const unpricedCostTypes = Array.isArray(costTypes)
          ? costTypes
              .filter(ct => !existingCostTypeIds.includes(ct.id))
              .map(ct => ({ costTypeId: ct.id, price: "" }))
          : [];
        
        if (unpricedCostTypes.length > 0) {
          form.setValue("prices", unpricedCostTypes);
        } else {
          form.setValue("prices", [{ costTypeId: 0, price: "" }]);
        }
      }
    }
  }, [isFormDialogOpen, selectedCostPrice, costPrices, costTypes, form]);
  
  // Create cost price
  const createCostPriceMutation = useMutation({
    mutationFn: async (values: any) => {
      // Process multiple prices
      const { customerId, serviceId, prices } = values;
      
      // We'll use Promise.all to create multiple prices in parallel
      const createPromises = prices.map((priceItem: any) => {
        return apiRequest("POST", "/api/cost-prices", {
          customerId,
          serviceId,
          costTypeId: priceItem.costTypeId,
          price: priceItem.price
        });
      });
      
      return Promise.all(createPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-prices/customer", selectedCustomerId, "/service", selectedServiceId] });
      setIsFormDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Báo giá chi phí đã được tạo thành công",
      });
      refetchCostPrices();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: `Không thể tạo báo giá chi phí: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update cost price
  const updateCostPriceMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!selectedCostPrice) return;
      return apiRequest("PATCH", `/api/cost-prices/${selectedCostPrice.id}`, {
        customerId: values.customerId,
        serviceId: values.serviceId,
        costTypeId: values.prices[0].costTypeId,
        price: values.prices[0].price
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-prices/customer", selectedCustomerId, "/service", selectedServiceId] });
      setIsFormDialogOpen(false);
      setSelectedCostPrice(null);
      toast({
        title: "Thành công",
        description: "Báo giá chi phí đã được cập nhật thành công",
      });
      refetchCostPrices();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: `Không thể cập nhật báo giá chi phí: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete cost price
  const deleteCostPriceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/cost-prices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-prices/customer", selectedCustomerId, "/service", selectedServiceId] });
      setDeleteDialogOpen(false);
      setCostPriceToDelete(null);
      toast({
        title: "Đã xóa báo giá chi phí",
        description: "Báo giá chi phí đã được xóa thành công",
      });
      refetchCostPrices();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: `Không thể xóa báo giá chi phí: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: CostPriceFormValues) => {
    if (selectedCostPrice) {
      updateCostPriceMutation.mutate(values);
    } else {
      createCostPriceMutation.mutate(values);
    }
  };

  // Get customer name by ID
  const getCustomerName = (customerId: number) => {
    const customer = Array.isArray(customers) 
      ? customers.find((c: Customer) => c.id === customerId) 
      : null;
    return customer?.name || "Unknown";
  };

  // Get service name by ID
  const getServiceName = (serviceId: number) => {
    const service = Array.isArray(services) 
      ? services.find((s: Service) => s.id === serviceId) 
      : null;
    return service?.name || "Unknown";
  };

  // Get cost type name by ID
  const getCostTypeName = (costTypeId: number) => {
    const costType = Array.isArray(costTypes) 
      ? costTypes.find((ct: CostType) => ct.id === costTypeId) 
      : null;
    return costType?.name || "Unknown";
  };

  const isLoading = isLoadingCustomers || isLoadingServices || isLoadingCostTypes;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/pricing">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Báo giá chi phí</h1>
          </div>
          <p className="text-muted-foreground">
            Quản lý báo giá chi phí theo loại chi phí
          </p>
        </div>
        {selectedCustomerId && selectedServiceId && (
          <div className="mt-4 lg:mt-0">
            <Button onClick={() => {
              setSelectedCostPrice(null);
              setIsFormDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm báo giá chi phí
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Chọn khách hàng</CardTitle>
            <CardDescription>
              Chọn khách hàng để xem và quản lý báo giá chi phí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCustomerId?.toString() || ""}
              onValueChange={(value) => {
                setSelectedCustomerId(parseInt(value));
                setSelectedServiceId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(customers) ? customers.map((customer: Customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chọn dịch vụ</CardTitle>
            <CardDescription>
              Chọn dịch vụ để xem và quản lý báo giá chi phí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedServiceId?.toString() || ""}
              onValueChange={(value) => setSelectedServiceId(parseInt(value))}
              disabled={!selectedCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCustomerId ? "Chọn dịch vụ" : "Vui lòng chọn khách hàng trước"} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(services) ? services.map((service: Service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedCustomerId && selectedServiceId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Báo giá chi phí: {getCustomerName(selectedCustomerId)} - {getServiceName(selectedServiceId)}
            </CardTitle>
            <CardDescription>
              Danh sách báo giá theo loại chi phí
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCostPrices ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại chi phí</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(costPrices) && costPrices.length > 0 ? (
                    costPrices.map((costPrice: CostPrice) => (
                      <TableRow key={costPrice.id}>
                        <TableCell className="font-medium">
                          {costPrice.costType?.name || getCostTypeName(costPrice.costTypeId)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(costPrice.price)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => {
                                setSelectedCostPrice(costPrice);
                                setIsFormDialogOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={() => {
                                  setCostPriceToDelete({ id: costPrice.id });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Chưa có báo giá chi phí nào. Vui lòng thêm báo giá mới.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cost Price Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-4">
          <DialogHeader className="px-2">
            <DialogTitle>
              {selectedCostPrice ? "Chỉnh sửa giá chi phí" : "Thêm báo giá chi phí mới"}
            </DialogTitle>
            <DialogDescription>
              {selectedCostPrice
                ? "Cập nhật thông tin giá chi phí dưới đây."
                : "Nhập thông tin giá chi phí cho loại chi phí."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Khu vực thông tin khách hàng và dịch vụ - chỉ hiển thị, không chỉnh sửa */}
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Thông tin chung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Khách hàng</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getCustomerName(selectedCustomerId || 0)}
                    </p>
                  </div>
                  <div>
                    <Label>Dịch vụ</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getServiceName(selectedServiceId || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Khu vực thông tin giá chi phí */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Báo giá theo loại chi phí</h3>
                  {!selectedCostPrice && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => append({ costTypeId: 0, price: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Thêm loại chi phí
                    </Button>
                  )}
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-md p-3 mb-3 relative hover:bg-accent/10">
                    {fields.length > 1 && !selectedCostPrice && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-0">
                      <FormField
                        control={form.control}
                        name={`prices.${index}.costTypeId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loại chi phí *</FormLabel>
                            <Select
                              disabled={isLoadingCostTypes || (selectedCostPrice !== null)}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString() || ""}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn loại chi phí" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(costTypes) ? costTypes.map((costType: CostType) => (
                                  <SelectItem
                                    key={costType.id}
                                    value={costType.id.toString()}
                                  >
                                    {costType.name}
                                  </SelectItem>
                                )) : null}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`prices.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giá *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                                  VND
                                </span>
                                <Input
                                  type="text"
                                  placeholder="0"
                                  className="pl-12"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={createCostPriceMutation.isPending || updateCostPriceMutation.isPending}
                >
                  {selectedCostPrice ? "Cập nhật giá" : "Tạo báo giá"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Báo giá chi phí này sẽ bị xóa vĩnh viễn
              khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (costPriceToDelete) {
                  deleteCostPriceMutation.mutate(costPriceToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
