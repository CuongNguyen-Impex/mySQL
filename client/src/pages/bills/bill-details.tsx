import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { formatCurrency, getProfitColorClass, getStatusColor } from "@/lib/utils";
import { ArrowLeft, Edit, Trash2, Save } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import MultiCostForm from "@/components/bills/multi-cost-form";
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
  const [status, setStatus] = useState("");
  const [isStatusUpdateLoading, setIsStatusUpdateLoading] = useState(false);
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!bill) throw new Error("Bill not found");
      
      const updatedBill = {
        ...bill,
        status: newStatus
      };
      
      return apiRequest("PATCH", `/api/bills/${params.id}`, updatedBill);
    },
    onSuccess: () => {
      // Invalidate bill-related queries
      queryClient.invalidateQueries({ queryKey: [`/api/bills/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Invalidate all report queries
      queryClient.invalidateQueries({ queryKey: ["/api/reports/by-customer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/by-supplier"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/bills"] });
      
      toast({
        title: "Trạng thái đã cập nhật",
        description: `Trạng thái hóa đơn đã được cập nhật thành ${status}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: `Không thể cập nhật trạng thái: ${error}`,
        variant: "destructive",
      });
    },
  });

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
      // Invalidate all queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/by-customer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/by-supplier"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/bills"] });
      
      toast({
        title: "Đã xóa hóa đơn",
        description: "Hóa đơn đã được xóa thành công",
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

  // Update status when the bill data changes
  useEffect(() => {
    if (bill?.status) {
      setStatus(bill.status);
    }
  }, [bill]);
  
  // Handle status update
  const handleStatusUpdate = () => {
    if (!status || status === bill?.status) return;
    
    setIsStatusUpdateLoading(true);
    updateStatusMutation.mutate(status, {
      onSettled: () => {
        setIsStatusUpdateLoading(false);
      }
    });
  };

  // Functions to handle form submission success
  const handleBillUpdateSuccess = () => {
    setIsEditDialogOpen(false);
    refetch();
    
    // Invalidate all queries that might be affected
    queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/by-customer"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/by-supplier"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/bills"] });
    
    toast({
      title: "Thành công",
      description: "Hóa đơn đã được cập nhật",
    });
  };

  const handleCostAddSuccess = () => {
    setIsAddCostDialogOpen(false);
    refetch();
    
    // Invalidate all queries that might be affected
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/by-supplier"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/bills"] });
    
    toast({
      title: "Thành công",
      description: "Chi phí đã được thêm",
    });
  };

  const handleRevenueAddSuccess = () => {
    setIsAddRevenueDialogOpen(false);
    refetch();
    
    // Invalidate all queries that might be affected
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/by-customer"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/bills"] });
    
    toast({
      title: "Thành công",
      description: "Doanh thu đã được thêm",
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

  // This is a local function but we're now using the imported one from utils

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
            <span>Thông tin hóa đơn</span>
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa hóa đơn</DialogTitle>
                    <DialogDescription>
                      Cập nhật thông tin cho hóa đơn này
                    </DialogDescription>
                  </DialogHeader>
                  <BillForm bill={bill} onSuccess={handleBillUpdateSuccess} />
                </DialogContent>
              </Dialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này không thể hoàn tác. Hóa đơn và tất cả các chi phí, doanh thu liên quan sẽ bị xóa vĩnh viễn.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteBillMutation.mutate()}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Xóa
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
              <p className="text-sm text-muted-foreground">Số hóa đơn</p>
              <p className="text-base font-medium">{bill?.billNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số Invoice</p>
              <p className="text-base font-medium">{bill?.invoiceNo || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ngày tạo</p>
              <p className="text-base font-medium">{new Date(bill?.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Khách hàng</p>
              <p className="text-base font-medium">{bill?.customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dịch vụ</p>
              <p className="text-base font-medium">{bill?.service?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loại</p>
              <p className="text-base font-medium">{bill?.importExportType || "Nhập"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số kiện</p>
              <p className="text-base font-medium">{bill?.packageCount || "0"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loại hàng</p>
              <p className="text-base font-medium">{bill?.goodsType || "Air"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <Badge className={cn("mt-1", getStatusBadgeClass(bill?.status))}>
                {bill?.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ghi chú</p>
              <p className="text-base font-medium">{bill?.notes || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
              <p className="text-base font-medium text-success">{formatCurrency(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng chi phí</p>
              <p className="text-base font-medium text-destructive">{formatCurrency(totalCosts)}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-6">
              <p className="text-lg font-medium">Lợi nhuận</p>
              <p className={cn("text-lg font-bold", getProfitColorClass(profit))}>
                {formatCurrency(profit)}
              </p>
            </div>
            
            <div className="border-t pt-6">
              <p className="text-base font-medium mb-2">Cập nhật trạng thái</p>
              <div className="flex items-center gap-2">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleStatusUpdate} 
                  disabled={isStatusUpdateLoading || status === bill?.status}
                >
                  {isStatusUpdateLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Cập nhật trạng thái
                    </>
                  )}
                </Button>
              </div>
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
                <TabsTrigger value="costs" className="flex-1 max-w-[200px]">Chi phí</TabsTrigger>
                <TabsTrigger value="revenue" className="flex-1 max-w-[200px]">Doanh thu</TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          {/* Costs Tab */}
          <TabsContent value="costs" className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Chi tiết chi phí</h3>
                <Dialog open={isAddCostDialogOpen} onOpenChange={setIsAddCostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      Thêm chi phí
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[1200px] w-[95vw]">
                    <DialogHeader>
                      <DialogTitle>Thêm chi phí</DialogTitle>
                      <DialogDescription>
                        Bạn có thể thêm nhiều chi phí cùng lúc
                      </DialogDescription>
                    </DialogHeader>
                    {bill && <MultiCostForm billId={bill.id} onSuccess={handleCostAddSuccess} />}
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
                <h3 className="text-lg font-medium">Chi tiết doanh thu</h3>
                <Dialog open={isAddRevenueDialogOpen} onOpenChange={setIsAddRevenueDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      Thêm doanh thu
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Thêm doanh thu</DialogTitle>
                      <DialogDescription>
                        Nhập thông tin cho doanh thu mới
                      </DialogDescription>
                    </DialogHeader>
                    {bill && <RevenueForm 
                      billId={bill.id} 
                      customerId={bill.customerId}
                      onSuccess={handleRevenueAddSuccess} 
                    />}
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
