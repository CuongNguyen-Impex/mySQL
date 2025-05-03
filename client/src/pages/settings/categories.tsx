import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
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
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsCategories() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("customers");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: string } | null>(null);
  
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/services"],
  });
  
  const { data: costTypes, isLoading: isLoadingCostTypes } = useQuery({
    queryKey: ["/api/cost-types"],
  });
  
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await apiRequest("DELETE", `api/${itemToDelete.type}/${itemToDelete.id}`);
      
      queryClient.invalidateQueries({ queryKey: [`/api/${itemToDelete.type}`] });
      
      toast({
        title: "Deleted successfully",
        description: `The item has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete: ${error}`,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const confirmDelete = (id: number, type: string) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your business categories
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="costTypes">Cost Types</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        
        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customers</CardTitle>
                <CardDescription>
                  Manage your customer list
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Customer</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new customer
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const customer = {
                        name: formData.get('name') as string,
                        contactPerson: formData.get('contactPerson') as string,
                        email: formData.get('email') as string,
                        phone: formData.get('phone') as string,
                        address: formData.get('address') as string
                      };
                      
                      const createCustomer = async () => {
                        try {
                          const response = await apiRequest('POST', '/api/customers', customer);
                          const newCustomer = await response.json();
                          queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
                          toast({
                            title: 'Thành công',
                            description: `Khách hàng "${newCustomer.name}" đã được thêm thành công`,
                          });
                          // Close the dialog
                          const closeDialogButton = document.querySelector('[data-radix-dialog-primitive="close"]');
                          if (closeDialogButton) {
                            (closeDialogButton as HTMLButtonElement).click();
                          }
                        } catch (error: any) {
                          let errorMessage = error.message || 'Failed to create customer';
                          
                          // Xử lý phản hồi lỗi từ server
                          if (error.status === 400) {
                            try {
                              const errorData = await error.json();
                              errorMessage = errorData.message || errorMessage;
                            } catch {}
                          }
                          
                          toast({
                            title: 'Lỗi',
                            description: errorMessage,
                            variant: 'destructive',
                          });
                        }
                      };
                      
                      createCustomer();
                    }}>
                      <div>
                        <Label htmlFor="name">Tên khách hàng *</Label>
                        <Input id="name" name="name" placeholder="Tên công ty khách hàng" required />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactPerson">Người liên hệ</Label>
                        <Input id="contactPerson" name="contactPerson" placeholder="Tên người liên hệ" />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="Email liên hệ" />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input id="phone" name="phone" placeholder="Số điện thoại liên hệ" />
                      </div>
                      
                      <div>
                        <Label htmlFor="address">Địa chỉ</Label>
                        <Input id="address" name="address" placeholder="Địa chỉ đơn vị" />
                      </div>
                      
                      <Button type="submit" className="w-full">
                        Thêm khách hàng
                      </Button>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingCustomers ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers?.map((customer: any) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.contactPerson || "—"}</TableCell>
                        <TableCell>{customer.email || "—"}</TableCell>
                        <TableCell>{customer.phone || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Customer</DialogTitle>
                                    <DialogDescription>
                                      Update the customer details
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="py-4">
                                    <form className="space-y-4" onSubmit={(e) => {
                                      e.preventDefault();
                                      const formData = new FormData(e.currentTarget);
                                      const updatedCustomer = {
                                        name: formData.get('name') as string,
                                        contactPerson: formData.get('contactPerson') as string,
                                        email: formData.get('email') as string,
                                        phone: formData.get('phone') as string,
                                        address: formData.get('address') as string
                                      };
                                      
                                      const updateCustomer = async () => {
                                        try {
                                          const response = await apiRequest('PATCH', `/api/customers/${customer.id}`, updatedCustomer);
                                          const result = await response.json();
                                          queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
                                          toast({
                                            title: 'Thành công',
                                            description: `Đã cập nhật thông tin khách hàng "${result.name}"`
                                          });
                                          // Close the dialog
                                          const closeDialogButton = document.querySelector('[data-radix-dialog-primitive="close"]');
                                          if (closeDialogButton) {
                                            (closeDialogButton as HTMLButtonElement).click();
                                          }
                                        } catch (error: any) {
                                          let errorMessage = error.message || 'Failed to update customer';
                                          
                                          // Xử lý phản hồi lỗi từ server
                                          if (error.status === 400) {
                                            try {
                                              const errorData = await error.json();
                                              errorMessage = errorData.message || errorMessage;
                                            } catch {}
                                          }
                                          
                                          toast({
                                            title: 'Lỗi',
                                            description: errorMessage,
                                            variant: 'destructive',
                                          });
                                        }
                                      };
                                      
                                      updateCustomer();
                                    }}>
                                      <div>
                                        <Label htmlFor="edit-name">Tên khách hàng *</Label>
                                        <Input 
                                          id="edit-name" 
                                          name="name" 
                                          placeholder="Tên công ty khách hàng" 
                                          defaultValue={customer.name} 
                                          required 
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label htmlFor="edit-contactPerson">Người liên hệ</Label>
                                        <Input 
                                          id="edit-contactPerson" 
                                          name="contactPerson" 
                                          placeholder="Tên người liên hệ" 
                                          defaultValue={customer.contactPerson || ''} 
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label htmlFor="edit-email">Email</Label>
                                        <Input 
                                          id="edit-email" 
                                          name="email" 
                                          type="email" 
                                          placeholder="Email liên hệ" 
                                          defaultValue={customer.email || ''} 
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label htmlFor="edit-phone">Số điện thoại</Label>
                                        <Input 
                                          id="edit-phone" 
                                          name="phone" 
                                          placeholder="Số điện thoại liên hệ" 
                                          defaultValue={customer.phone || ''} 
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label htmlFor="edit-address">Địa chỉ</Label>
                                        <Input 
                                          id="edit-address" 
                                          name="address" 
                                          placeholder="Địa chỉ đơn vị" 
                                          defaultValue={customer.address || ''} 
                                        />
                                      </div>
                                      
                                      <Button type="submit" className="w-full">
                                        Cập nhật thông tin
                                      </Button>
                                    </form>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={() => confirmDelete(customer.id, "customers")}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!customers || customers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No customers found. Add a customer to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Services</CardTitle>
                <CardDescription>
                  Manage your service offerings
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Service</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new service
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const service = {
                        name: formData.get('name') as string,
                        description: formData.get('description') as string
                      };
                      
                      const createService = async () => {
                        try {
                          const response = await apiRequest('POST', '/api/services', service);
                          const newService = await response.json();
                          queryClient.invalidateQueries({ queryKey: ['/api/services'] });
                          toast({
                            title: 'Thành công',
                            description: `Dịch vụ "${newService.name}" đã được thêm thành công`,
                          });
                          // Close the dialog
                          const closeDialogButton = document.querySelector('[data-radix-dialog-primitive="close"]');
                          if (closeDialogButton) {
                            (closeDialogButton as HTMLButtonElement).click();
                          }
                        } catch (error: any) {
                          let errorMessage = error.message || 'Không thể tạo dịch vụ';
                          
                          // Xử lý phản hồi lỗi từ server
                          if (error.status === 400) {
                            try {
                              const errorData = await error.json();
                              errorMessage = errorData.message || errorMessage;
                            } catch {}
                          }
                          
                          toast({
                            title: 'Lỗi',
                            description: errorMessage,
                            variant: 'destructive',
                          });
                        }
                      };
                      
                      createService();
                    }}>
                      <div>
                        <Label htmlFor="name">Tên dịch vụ *</Label>
                        <Input id="name" name="name" placeholder="Tên dịch vụ" required />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea 
                          id="description" 
                          name="description" 
                          placeholder="Mô tả chi tiết về dịch vụ" 
                        />
                      </div>
                      
                      <Button type="submit" className="w-full">
                        Thêm dịch vụ
                      </Button>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingServices ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services?.map((service: any) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.description || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Service</DialogTitle>
                                    <DialogDescription>
                                      Update the service details
                                    </DialogDescription>
                                  </DialogHeader>
                                  {/* Service form will go here */}
                                </DialogContent>
                              </Dialog>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={() => confirmDelete(service.id, "services")}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!services || services.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          No services found. Add a service to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Cost Types Tab */}
        <TabsContent value="costTypes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cost Types</CardTitle>
                <CardDescription>
                  Manage your cost categories
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cost Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Cost Type</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new cost type
                    </DialogDescription>
                  </DialogHeader>
                  {/* Cost type form will go here */}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingCostTypes ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costTypes?.map((costType: any) => (
                      <TableRow key={costType.id}>
                        <TableCell className="font-medium">{costType.name}</TableCell>
                        <TableCell>{costType.description || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Cost Type</DialogTitle>
                                    <DialogDescription>
                                      Update the cost type details
                                    </DialogDescription>
                                  </DialogHeader>
                                  {/* Cost type form will go here */}
                                </DialogContent>
                              </Dialog>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={() => confirmDelete(costType.id, "cost-types")}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!costTypes || costTypes.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          No cost types found. Add a cost type to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Suppliers</CardTitle>
                <CardDescription>
                  Manage your list of suppliers
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Supplier</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new supplier
                    </DialogDescription>
                  </DialogHeader>
                  {/* Supplier form will go here */}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingSuppliers ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers?.map((supplier: any) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contactPerson || "—"}</TableCell>
                        <TableCell>{supplier.email || "—"}</TableCell>
                        <TableCell>{supplier.phone || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Supplier</DialogTitle>
                                    <DialogDescription>
                                      Update the supplier details
                                    </DialogDescription>
                                  </DialogHeader>
                                  {/* Supplier form will go here */}
                                </DialogContent>
                              </Dialog>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={() => confirmDelete(supplier.id, "suppliers")}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!suppliers || suppliers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No suppliers found. Add a supplier to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected item and may affect related data throughout the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
