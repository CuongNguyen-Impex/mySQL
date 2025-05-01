import { Link } from "wouter";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bill } from "@shared/types";
import { cn, getStatusColor, formatCurrency, formatDate, getProfitColorClass } from "@/lib/utils";

interface BillListProps {
  bills: Bill[];
  isLoading: boolean;
  showActions?: boolean;
  onBillDelete?: () => void;
}

export default function BillList({ bills, isLoading, showActions = true, onBillDelete }: BillListProps) {
  const { toast } = useToast();

  const deleteBillMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/bills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Bill deleted",
        description: "The bill has been successfully deleted",
      });
      if (onBillDelete) onBillDelete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete the bill: ${error}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Calculate financial values
  const calculateTotalCost = (bill: Bill) => {
    if (!bill.costs) return 0;
    return bill.costs.reduce((sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
  };

  const calculateTotalRevenue = (bill: Bill) => {
    if (!bill.revenues) return 0;
    return bill.revenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount.toString()), 0);
  };

  const calculateProfit = (bill: Bill) => {
    return calculateTotalRevenue(bill) - calculateTotalCost(bill);
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Số Hóa Đơn</TableHead>
            <TableHead>Ngày Tạo</TableHead>
            <TableHead>Khách Hàng</TableHead>
            <TableHead>Dịch Vụ</TableHead>
            <TableHead>Trạng Thái</TableHead>
            <TableHead className="text-right">Doanh Thu</TableHead>
            <TableHead className="text-right">Chi Phí</TableHead>
            <TableHead className="text-right">Lợi Nhuận</TableHead>
            {showActions && <TableHead className="text-right">Thao Tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => {
            const totalCost = calculateTotalCost(bill);
            const totalRevenue = calculateTotalRevenue(bill);
            const profit = calculateProfit(bill);
            
            return (
              <TableRow key={bill.id}>
                <TableCell>
                  <Link href={`/bills/${bill.id}`}>
                    <span className="text-primary hover:underline cursor-pointer">
                      {bill.billNo}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>{formatDate(bill.date)}</TableCell>
                <TableCell>{bill.customer?.name || "-"}</TableCell>
                <TableCell>{bill.service?.name || "-"}</TableCell>
                <TableCell>
                  <Badge className={cn(getStatusColor(bill.status))}>
                    {bill.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totalRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totalCost)}
                </TableCell>
                <TableCell className={cn("text-right font-medium", getProfitColorClass(profit))}>
                  {formatCurrency(profit)}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/bills/${bill.id}`}>
                            <span className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" />
                              View Details
                            </span>
                          </Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Nó sẽ xóa vĩnh viễn
                                hóa đơn và tất cả các bản ghi chi phí và doanh thu liên quan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBillMutation.mutate(bill.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          
          {bills.length === 0 && (
            <TableRow>
              <TableCell colSpan={showActions ? 9 : 8} className="text-center py-6 text-muted-foreground">
                Không tìm thấy hóa đơn nào.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
