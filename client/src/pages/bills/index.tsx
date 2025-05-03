import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BillList from "@/components/bills/bill-list";
import BillForm from "@/components/bills/bill-form";
import { Bill } from "@shared/types";

export default function Bills() {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [billNoFilter, setBillNoFilter] = useState<string>("");
  // Fetch bills with filters
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "/api/bills", 
      status !== "all" ? status : undefined,
      customerFilter || undefined,
      serviceFilter || undefined,
      dateRange.start || undefined,
      dateRange.end || undefined
    ],
  });

  // Fetch customers and services for filter dropdowns
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const bills = data?.bills || [];

  // Memoize filtered bills instead of using useEffect
  const filteredBills = useMemo(() => {
    if (billNoFilter) {
      return bills.filter(bill =>
        bill.billNo.toLowerCase().includes(billNoFilter.toLowerCase())
      );
    } else {
      return bills;
    }
  }, [bills, billNoFilter]);

  const handleFilterApply = () => {
    refetch();
    toast({
      description: "Filters applied successfully",
    });
  };

  const handleFilterReset = () => {
    setStatus("all");
    setCustomerFilter("");
    setServiceFilter("");
    setDateRange({ start: "", end: "" });
    refetch();
    toast({
      description: "Filters have been reset",
    });
  };

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    refetch();
    toast({
      title: "Success",
      description: "Bill created successfully",
    });
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Hóa Đơn</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các hóa đơn logistics
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Lọc Hóa Đơn</SheetTitle>
                <SheetDescription>
                  Áp dụng bộ lọc để tìm kiếm hóa đơn cụ thể
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="Pending">Chờ xử lý</SelectItem>
                      <SelectItem value="In Progress">Đang xử lý</SelectItem>
                      <SelectItem value="Completed">Hoàn thành</SelectItem>
                      <SelectItem value="Cancelled">Hủy bỏ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={customerFilter} onValueChange={setCustomerFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_customers">All Customers</SelectItem>
                      {customers?.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_services">All Services</SelectItem>
                      {services?.map((service: any) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-start">Start Date</Label>
                  <Input
                    id="date-start"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-end">End Date</Label>
                  <Input
                    id="date-end"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleFilterReset}>
                  Reset
                </Button>
                <Button onClick={handleFilterApply}>Apply Filters</Button>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
                <DialogDescription>
                  Add the details for your new bill
                </DialogDescription>
              </DialogHeader>
              <BillForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Bills</CardTitle>
            <CardDescription>
              View and manage all your logistics bills
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo số hóa đơn..."
                value={billNoFilter}
                onChange={(e) => setBillNoFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            {billNoFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setBillNoFilter('')}
                className="h-9">
                Xóa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Bills</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="inProgress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <BillList bills={filteredBills} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="pending">
              <BillList
                bills={filteredBills.filter((bill: Bill) => bill.status === "Pending")}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="inProgress">
              <BillList
                bills={filteredBills.filter((bill: Bill) => bill.status === "In Progress")}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="completed">
              <BillList
                bills={filteredBills.filter((bill: Bill) => bill.status === "Completed")}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
