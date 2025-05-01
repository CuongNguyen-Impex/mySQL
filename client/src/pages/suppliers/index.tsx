import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supplierFormSchema } from "@shared/types";
import { Supplier } from "@shared/types";

export default function Suppliers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

  // Fetch suppliers
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Setup form
  const form = useForm({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: ""
    }
  });

  // Reset form when dialog opens/closes or when selectedSupplier changes
  React.useEffect(() => {
    if (isFormDialogOpen) {
      if (selectedSupplier) {
        form.reset({
          name: selectedSupplier.name,
          contactPerson: selectedSupplier.contactPerson || "",
          email: selectedSupplier.email || "",
          phone: selectedSupplier.phone || "",
          address: selectedSupplier.address || ""
        });
      } else {
        form.reset({
          name: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: ""
        });
      }
    }
  }, [isFormDialogOpen, selectedSupplier, form]);

  // Create or update supplier
  const supplierMutation = useMutation({
    mutationFn: async (values: any) => {
      if (selectedSupplier) {
        return apiRequest("PATCH", `/api/suppliers/${selectedSupplier.id}`, values);
      } else {
        return apiRequest("POST", "/api/suppliers", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsFormDialogOpen(false);
      setSelectedSupplier(null);
      toast({
        title: "Success",
        description: selectedSupplier
          ? "Supplier updated successfully"
          : "Supplier created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${selectedSupplier ? "update" : "create"} supplier: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete supplier
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete supplier: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: any) => {
    supplierMutation.mutate(values);
  };

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers?.filter((supplier: Supplier) => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your supplier information
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Button onClick={() => {
            setSelectedSupplier(null);
            setIsFormDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Supplier List</CardTitle>
            <CardDescription>
              View and manage your suppliers
            </CardDescription>
          </div>
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-[300px]"
            />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier: Supplier) => (
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
                          <DropdownMenuItem onSelect={() => {
                            setSelectedSupplier(supplier);
                            setIsFormDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onSelect={() => {
                              setSupplierToDelete(supplier.id);
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
                {filteredSuppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      {searchQuery
                        ? "No suppliers found matching your search."
                        : "No suppliers found. Add a supplier to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Supplier Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
            <DialogDescription>
              {selectedSupplier
                ? "Update the supplier's information below."
                : "Enter the details for the new supplier."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Primary contact" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Business address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={supplierMutation.isPending}>
                  {selectedSupplier ? "Update Supplier" : "Create Supplier"}
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
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              supplier and may affect related cost records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (supplierToDelete) deleteSupplierMutation.mutate(supplierToDelete);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
