import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import BillForm from "@/components/bills/bill-form";
import CostForm from "@/components/bills/cost-form";
import RevenueForm from "@/components/bills/revenue-form";
import CostList from "@/components/bills/cost-list";
import RevenueList from "@/components/bills/revenue-list";
import { cn } from "@/lib/utils";

export default function BillDetails() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("costs");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCostDialogOpen, setIsAddCostDialogOpen] = useState(false);
  const [isAddRevenueDialogOpen, setIsAddRevenueDialogOpen] = useState(false);

  // Fetch bill details
  const { 
    data: bill, 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: [`/api/bills/${params.id}`],
  });

  // Delete bill mutation
  const deleteBillMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/bills/${params.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Bill deleted",
        description: "The bill has been successfully deleted",
      });
      navigate("/bills");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete the bill: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Calculate financial totals
  const totalCosts = bill?.costs?.reduce(
    (acc: number, cost: any) => acc + parseFloat(cost.amount),
    0
  ) || 0;

  const totalRevenue = bill?.revenue?.reduce(
    (acc: number, revenue: any) => acc + parseFloat(revenue.amount),
    0
  ) || 0;

  const profit = totalRevenue - totalCosts;

  // Functions to handle form submission success
  const handleBillUpdateSuccess = () => {
    setIsEditDialogOpen(false);
    refetch();
    toast({
      title: "Success",
      description: "Bill updated successfully",
    });
  };

  const handleCostAddSuccess = () => {
    setIsAddCostDialogOpen(false);
    refetch();
    toast({
      title: "Success",
      description: "Cost added successfully",
    });
  };

  const handleRevenueAddSuccess = () => {
    setIsAddRevenueDialogOpen(false);
    refetch();
    toast({
      title: "Success",
      description: "Revenue added successfully",
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    if (!status) return "";
    
    const statusMap: Record<string, string> = {
      "Completed": "status-badge-completed",
      "Pending": "status-badge-pending",
      "In Progress": "status-badge-in-progress",
      "Cancelled": "status-badge-cancelled",
    };
    
    return statusMap[status] || "";
  };

  // Get profit/loss color
  const getProfitColorClass = (value: number) => {
    if (value > 0) return "text-success";
    if (value < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/bills")} 
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/bills")} 
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Bill #{bill?.billNo}</h1>
          <p className="text-muted-foreground">
            {bill?.customer?.name} - {new Date(bill?.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {/* Bill Info Card */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>Bill Information</span>
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Edit Bill</DialogTitle>
                    <DialogDescription>
                      Update the details for this bill
                    </DialogDescription>
                  </DialogHeader>
                  <BillForm bill={bill} onSuccess={handleBillUpdateSuccess} />
                </DialogContent>
              </Dialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the
                      bill and all associated costs and revenue records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteBillMutation.mutate()}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Bill Number</p>
              <p className="text-base font-medium">{bill?.billNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="text-base font-medium">{new Date(bill?.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-base font-medium">{bill?.customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="text-base font-medium">{bill?.service?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={cn("mt-1", getStatusBadgeClass(bill?.status))}>
                {bill?.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-base font-medium">{bill?.notes || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-base font-medium text-success">${totalRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Costs</p>
              <p className="text-base font-medium text-destructive">${totalCosts.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">Profit</p>
              <p className={cn("text-lg font-bold", getProfitColorClass(profit))}>
                ${profit.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Costs and Revenue Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b">
            <div className="px-4">
              <TabsList className="w-full justify-start h-12">
                <TabsTrigger value="costs" className="flex-1 max-w-[200px]">Costs</TabsTrigger>
                <TabsTrigger value="revenue" className="flex-1 max-w-[200px]">Revenue</TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          {/* Costs Tab */}
          <TabsContent value="costs" className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Cost Details</h3>
                <Dialog open={isAddCostDialogOpen} onOpenChange={setIsAddCostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      Add Cost
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New Cost</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new cost
                      </DialogDescription>
                    </DialogHeader>
                    <CostForm billId={bill.id} onSuccess={handleCostAddSuccess} />
                  </DialogContent>
                </Dialog>
              </div>
              
              <CostList costs={bill?.costs || []} billId={bill?.id} onCostChange={refetch} />
            </div>
          </TabsContent>
          
          {/* Revenue Tab */}
          <TabsContent value="revenue" className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Revenue Details</h3>
                <Dialog open={isAddRevenueDialogOpen} onOpenChange={setIsAddRevenueDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      Add Revenue
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New Revenue</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new revenue
                      </DialogDescription>
                    </DialogHeader>
                    <RevenueForm 
                      billId={bill.id} 
                      customerId={bill.customerId}
                      onSuccess={handleRevenueAddSuccess} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              <RevenueList 
                revenues={bill?.revenue || []} 
                billId={bill?.id} 
                onRevenueChange={refetch}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
