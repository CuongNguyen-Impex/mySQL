import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MoreHorizontal, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
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
import { priceFormSchema } from "@shared/types";
import { formatCurrency } from "@/lib/utils";

export default function Pricing() {
  const { toast } = useToast();
  const [selectedPrice, setSelectedPrice] = useState<any | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [priceToDelete, setpriceToDelete] = useState<{id: number, customerId: number, serviceId: number} | null>(null);
  const [customerFilter, setCustomerFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  // Fetch prices
  const { data: prices, isLoading: isLoadingPrices } = useQuery({
    queryKey: ["/api/prices"],
  });

  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Fetch services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/services"],
  });

  // Setup form for multi prices
  const form = useForm({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      customerId: undefined,
      prices: [
        { serviceId: undefined, price: undefined }
      ]
    }
  });
  
  // Setup field array for multiple service prices
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "prices"
  });

  // Reset form when dialog opens/closes or when selectedPrice changes
  React.useEffect(() => {
    if (isFormDialogOpen) {
      if (selectedPrice) {
        form.reset({
          customerId: selectedPrice.customerId,
          prices: [
            { serviceId: selectedPrice.serviceId, price: selectedPrice.price }
          ]
        });
      } else {
        form.reset({
          customerId: undefined,
          prices: [
            { serviceId: undefined, price: undefined }
          ]
        });
      }
    }
  }, [isFormDialogOpen, selectedPrice, form]);

  // Create or update price
  const priceMutation = useMutation({
    mutationFn: async (values: any) => {
      if (selectedPrice) {
        return apiRequest("PATCH", `/api/prices/${selectedPrice.id}`, values);
      } else {
        return apiRequest("POST", "/api/prices", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
      setIsFormDialogOpen(false);
      setSelectedPrice(null);
      toast({
        title: "Success",
        description: selectedPrice
          ? "Price updated successfully"
          : "Price created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${selectedPrice ? "update" : "create"} price: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete price
  const deletePriceMutation = useMutation({
    mutationFn: async (params: {id: number, customerId: number, serviceId: number}) => {
      return apiRequest("DELETE", `/api/prices/${params.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
      setDeleteDialogOpen(false);
      setpriceToDelete(null);
      toast({
        title: "Success",
        description: "Price deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete price: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Create or update price - updated for multi price form
  const onSubmit = (values: any) => {
    if (selectedPrice) {
      // Single price update
      priceMutation.mutate({
        id: selectedPrice.id,
        customerId: values.customerId,
        serviceId: values.prices[0].serviceId,
        price: values.prices[0].price
      });
    } else {
      // Process multiple prices
      const { customerId, prices } = values;
      
      // We'll use a Promise.all to create multiple prices in parallel
      const createPromises = prices.map((priceItem: any) => {
        return apiRequest("POST", "/api/prices", {
          customerId,
          serviceId: priceItem.serviceId,
          price: priceItem.price
        });
      });
      
      Promise.all(createPromises)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
          setIsFormDialogOpen(false);
          toast({
            title: "Success",
            description: `${prices.length} giá mới đã được tạo thành công`,
          });
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: `Không thể tạo giá: ${error}`,
            variant: "destructive",
          });
        });
    }
  };

  // Filter prices based on selected customer and service
  const filteredPrices = Array.isArray(prices) ? prices.filter((price: any) => {
    const customerMatch = customerFilter ? price.customerId.toString() === customerFilter : true;
    const serviceMatch = serviceFilter ? price.serviceId.toString() === serviceFilter : true;
    return customerMatch && serviceMatch;
  }) : [];

  // Get customer name by ID
  const getCustomerName = (customerId: number) => {
    const customer = Array.isArray(customers) ? customers.find((c: any) => c.id === customerId) : null;
    return customer?.name || "Unknown";
  };

  // Get service name by ID
  const getServiceName = (serviceId: number) => {
    const service = Array.isArray(services) ? services.find((s: any) => s.id === serviceId) : null;
    return service?.name || "Unknown";
  };

  const isLoading = isLoadingPrices || isLoadingCustomers || isLoadingServices;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pricing</h1>
          <p className="text-muted-foreground">
            Manage service pricing by customer
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Button onClick={() => {
            setSelectedPrice(null);
            setIsFormDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Price
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Danh sách báo giá</CardTitle>
            <CardDescription>
              Xem và quản lý giá dịch vụ theo khách hàng
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_customers">Tất cả khách hàng</SelectItem>
                {Array.isArray(customers) ? customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_services">Tất cả dịch vụ</SelectItem>
                {Array.isArray(services) ? services.map((service: any) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((price: any) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">{getCustomerName(price.customerId)}</TableCell>
                    <TableCell>{getServiceName(price.serviceId)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(price.price)}</TableCell>
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
                            setSelectedPrice(price);
                            setIsFormDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onSelect={() => {
                              setpriceToDelete({
                                id: price.id,
                                customerId: price.customerId,
                                serviceId: price.serviceId
                              });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPrices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      {customerFilter || serviceFilter
                        ? "No prices found matching your filters."
                        : "No prices found. Add a price to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Price Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedPrice ? "Chỉnh sửa giá" : "Thêm báo giá mới"}</DialogTitle>
            <DialogDescription>
              {selectedPrice
                ? "Cập nhật thông tin giá dưới đây."
                : "Nhập thông tin khách hàng và báo giá dịch vụ."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Khu vực 1: Thông tin khách hàng */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Thông tin khách hàng</h3>
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Khách hàng *</FormLabel>
                      <Select
                        disabled={isLoadingCustomers || (selectedPrice !== null)}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn khách hàng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer: any) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Khu vực 2: Thông tin dịch vụ và báo giá */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Thông tin dịch vụ và báo giá</h3>
                  {!selectedPrice && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => append({ serviceId: undefined, price: undefined })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Thêm dịch vụ
                    </Button>
                  )}
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-md p-4 mb-4 relative">
                    {fields.length > 1 && !selectedPrice && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <FormField
                        control={form.control}
                        name={`prices.${index}.serviceId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dịch vụ *</FormLabel>
                            <Select
                              disabled={isLoadingServices || (selectedPrice !== null)}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn dịch vụ" />
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
                <Button type="submit" disabled={priceMutation.isPending}>
                  {selectedPrice ? "Cập nhật giá" : "Tạo báo giá"}
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
              Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn
              cấu hình giá này và có thể ảnh hưởng đến các tính toán doanh thu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (priceToDelete) deletePriceMutation.mutate(priceToDelete);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
