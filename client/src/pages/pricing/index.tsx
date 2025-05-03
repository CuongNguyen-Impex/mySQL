import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MoreHorizontal, X, Printer, FileText } from "lucide-react";
import { Link } from "wouter";
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
import { priceFormSchema } from "@shared/types";
import { queryClient, apiRequest } from "@/lib/queryClient";

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

type Price = {
  id: number;
  customerId: number;
  serviceId: number;
  price: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function Pricing() {
  const { toast } = useToast();
  
  // State for filters
  const [customerFilter, setCustomerFilter] = useState<string>("all_customers");
  const [serviceFilter, setServiceFilter] = useState<string>("all_services");
  
  // State for dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  
  // State for selecting items
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [priceToDelete, setpriceToDelete] = useState<{id: number, customerId: number, serviceId: number} | null>(null);
  const [selectedCustomerForPrint, setSelectedCustomerForPrint] = useState<number | null>(null);
  
  // Fetch prices
  const { data: prices, isLoading: isLoadingPrices } = useQuery<Price[]>({
    queryKey: ["/api/prices"],
  });
  
  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch services
  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Define types for form values
  type PriceFormValues = {
    customerId: number | undefined;
    prices: {
      serviceId: number | undefined;
      price: string | undefined;
    }[];
  }

  // Setup form for multi prices
  const form = useForm<PriceFormValues>({
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
        title: "Thành công",
        description: selectedPrice
          ? "Báo giá đã được cập nhật thành công"
          : "Báo giá đã được tạo thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: `Không thể ${selectedPrice ? "cập nhật" : "tạo"} báo giá: ${error}`,
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
        title: "Đã xóa báo giá",
        description: "Báo giá đã được xóa thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: `Không thể xóa báo giá: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Create or update price - updated for multi price form
  const onSubmit = (values: PriceFormValues) => {
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
      const createPromises = prices.map((priceItem) => {
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
            title: "Thành công",
            description: `Đã tạo ${prices.length} báo giá mới thành công`,
          });
        })
        .catch((error) => {
          toast({
            title: "Lỗi",
            description: `Không thể tạo báo giá: ${error}`,
            variant: "destructive",
          });
        });
    }
  };

  // Filter prices based on selected customer and service
  const filteredPrices = Array.isArray(prices) ? prices.filter((price: Price) => {
    const customerMatch = customerFilter ? price.customerId.toString() === customerFilter : true;
    const serviceMatch = serviceFilter ? price.serviceId.toString() === serviceFilter : true;
    return customerMatch && serviceMatch;
  }) : [];

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

  const isLoading = isLoadingPrices || isLoadingCustomers || isLoadingServices;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Báo giá dịch vụ</h1>
          <p className="text-muted-foreground">
            Quản lý báo giá dịch vụ theo khách hàng
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex gap-2">
          <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)}>
            <Printer className="mr-2 h-4 w-4" />
            In báo giá
          </Button>
          <Link href="/pricing/cost-pricing">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Báo giá chi phí
            </Button>
          </Link>
          {/* <Button onClick={() => {
            setSelectedPrice(null);
            setIsFormDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm báo giá
          </Button> */}
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
                <SelectValue placeholder="Khách hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_customers">Tất cả khách hàng</SelectItem>
                {Array.isArray(customers) ? customers.map((customer: Customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dịch vụ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_services">Tất cả dịch vụ</SelectItem>
                {Array.isArray(services) ? services.map((service: Service) => (
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
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((price: Price) => (
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
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            setSelectedCustomerForPrint(price.customerId);
                            setIsPrintDialogOpen(true);
                          }}>
                            <Printer className="mr-2 h-4 w-4" />
                            In báo giá
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
                            Xóa
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
                        ? "Không tìm thấy giá phù hợp với bộ lọc."
                        : "Chưa có báo giá nào. Vui lòng thêm báo giá mới."}
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
        <DialogContent className="sm:max-w-[600px] p-4">
          <DialogHeader className="px-2">
            <DialogTitle>{selectedPrice ? "Chỉnh sửa giá" : "Thêm báo giá mới"}</DialogTitle>
            <DialogDescription>
              {selectedPrice
                ? "Cập nhật thông tin giá dưới đây."
                : "Nhập thông tin khách hàng và báo giá dịch vụ."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Khu vực 1: Thông tin khách hàng */}
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Thông tin khách hàng</h3>
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
                          {Array.isArray(customers) ? customers.map((customer: Customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Khu vực 2: Thông tin dịch vụ và báo giá */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
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
                  <div key={field.id} className="border rounded-md p-3 mb-3 relative hover:bg-accent/10">
                    {fields.length > 1 && !selectedPrice && (
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
                                {Array.isArray(services) ? services.map((service: Service) => (
                                  <SelectItem
                                    key={service.id}
                                    value={service.id.toString()}
                                  >
                                    {service.name}
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
                <Button type="submit" disabled={priceMutation.isPending}>
                  {selectedPrice ? "Cập nhật giá" : "Tạo báo giá"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>In báo giá</DialogTitle>
            <DialogDescription>
              Chọn khách hàng để in bảng báo giá dịch vụ.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Khách hàng</Label>
                <Select 
                  value={selectedCustomerForPrint?.toString() || ""} 
                  onValueChange={(value) => setSelectedCustomerForPrint(parseInt(value))}
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
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>Hủy</Button>
            <Button 
              type="button" 
              disabled={!selectedCustomerForPrint}
              onClick={() => {
                if (!selectedCustomerForPrint) {
                  toast({
                    title: "Thông báo",
                    description: "Vui lòng chọn khách hàng trước khi in báo giá",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Implement print functionality
                // This would be a good place to create a new tab with the print layout
                
                const customerPrices = Array.isArray(prices) 
                  ? prices.filter((price: Price) => price.customerId === selectedCustomerForPrint)
                  : [];
                  
                if (customerPrices.length === 0) {
                  toast({
                    title: "Thông báo",
                    description: "Không có báo giá nào cho khách hàng này",
                    variant: "destructive"
                  });
                  return;
                }
                
                // In báo giá thành công
                toast({
                  title: "In báo giá",
                  description: `Đã chuẩn bị báo giá cho ${getCustomerName(selectedCustomerForPrint)}`,
                });
                
                // Đặt lại giá trị và đóng hộp thoại
                setIsPrintDialogOpen(false);
                setSelectedCustomerForPrint(null);
                
                // Hiển thị báo giá trong cửa sổ mới
                const windowFeatures = "left=100,top=100,width=800,height=600";
                const printWindow = window.open('', '_blank', windowFeatures);
                
                if (printWindow) {
                  // Lấy thông tin khách hàng
                  const customer = Array.isArray(customers) 
                    ? customers.find((c: Customer) => c.id === selectedCustomerForPrint) 
                    : null;
                  
                  // Tạo nội dung HTML cho bảng báo giá
                  const today = new Date();
                  let htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Báo giá - ${customer?.name || ''}</title>
                      <meta charset="UTF-8">
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1, h2 { text-align: center; }
                        .header { margin-bottom: 30px; }
                        .info { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th, td { border: 1px solid #ddd; padding: 8px; }
                        th { background-color: #f2f2f2; text-align: left; }
                        .text-right { text-align: right; }
                        .footer { margin-top: 50px; text-align: center; font-style: italic; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>BẢNG BÁO GIÁ DỊCH VỤ</h1>
                        <h2>Khách hàng: ${customer?.name || ''}</h2>
                      </div>
                      
                      <div class="info">
                        <p><strong>Ngày báo giá:</strong> ${formatDate(today)}</p>
                        <p><strong>Địa chỉ:</strong> ${customer?.address || ''}</p>
                        <p><strong>Điện thoại:</strong> ${customer?.phone || ''}</p>
                        <p><strong>Email:</strong> ${customer?.email || ''}</p>
                      </div>
                      
                      <table>
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Tên dịch vụ</th>
                            <th>Đơn vị</th>
                            <th class="text-right">Đơn giá (VND)</th>
                          </tr>
                        </thead>
                        <tbody>
                  `;
                  
                  // Lấy danh sách các báo giá của khách hàng này
                  const customerPrices = Array.isArray(prices) 
                    ? prices.filter((price: Price) => price.customerId === selectedCustomerForPrint)
                    : [];
                  
                  // Thêm dòng cho mỗi dịch vụ
                  customerPrices.forEach((price: Price, index: number) => {
                    const service = Array.isArray(services) 
                      ? services.find((s: Service) => s.id === price.serviceId) 
                      : null;
                    
                    htmlContent += `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${service?.name || ''}</td>
                        <td>${service?.unit || 'Dịch vụ'}</td>
                        <td class="text-right">${formatCurrency(price.price)}</td>
                      </tr>
                    `;
                  });
                  
                  // Hoàn thành HTML
                  htmlContent += `
                        </tbody>
                      </table>
                      
                      <div class="footer">
                        <p>Báo giá có hiệu lực trong vòng 30 ngày kể từ ngày báo giá.</p>
                        <p>Mọi thắc mắc vui lòng liên hệ bộ phận kinh doanh.</p>
                      </div>
                    </body>
                    </html>
                  `;
                  
                  // Ghi nội dung vào cửa sổ mới và in
                  printWindow.document.open();
                  printWindow.document.write(htmlContent);
                  printWindow.document.close();
                  
                  // Đợi trang tải xong trước khi in
                  setTimeout(() => {
                    printWindow.print();
                  }, 500);
                }
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              In báo giá
            </Button>
          </DialogFooter>
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
