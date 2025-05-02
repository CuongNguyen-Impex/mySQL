import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils';
import CostsTable from '@/components/bills/costs-table';

export default function BillDetail() {
  const [_, params] = useRoute('/bills/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('');
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  
  const id = params?.id;
  
  // Fetch bill details
  const { data: bill, isLoading, refetch } = useQuery({
    queryKey: [`/api/bills/${id}`],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiRequest('GET', `/api/bills/${id}`);
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to fetch bill details');
    },
    enabled: !!id,
  });
  
  useEffect(() => {
    if (bill?.status) {
      setStatus(bill.status);
    }
  }, [bill]);

  // Update bill status
  const updateStatus = async () => {
    if (!id || !status || status === bill?.status) return;
    
    setIsUpdateLoading(true);
    try {
      const updatedBill = {
        ...bill,
        status,
      };
      
      const res = await apiRequest('PATCH', `/api/bills/${id}`, updatedBill);
      
      if (res.ok) {
        toast({
          title: 'Trạng thái cập nhật',
          description: `Trạng thái hóa đơn đã được thay đổi thành ${status}`,
        });
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể cập nhật trạng thái hóa đơn',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating bill status:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi cập nhật trạng thái',
        variant: 'destructive',
      });
    } finally {
      setIsUpdateLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full max-w-sm" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy hóa đơn</h2>
        <p className="text-muted-foreground mb-6">Hóa đơn yêu cầu không được tìm thấy hoặc không tồn tại</p>
        <Button onClick={() => setLocation('/bills')}>Trở về danh sách hóa đơn</Button>
      </div>
    );
  }

  // Calculate totals
  const totalCost = bill.costs?.reduce(
    (sum: number, cost: any) => sum + parseFloat(cost.amount.toString()), 
    0
  ) || 0;
  
  const totalRevenue = bill.revenues?.reduce(
    (sum: number, revenue: any) => sum + parseFloat(revenue.amount.toString()), 
    0
  ) || 0;
  
  const profit = totalRevenue - totalCost;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setLocation('/bills')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết hóa đơn #{bill.billNo}</h1>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Badge className={cn(getStatusColor(bill.status))}>
            {bill.status}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hóa đơn</CardTitle>
          <CardDescription>
            Xem và cập nhật thông tin chi tiết của hóa đơn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Số hóa đơn</h3>
                <p className="text-lg font-medium">{bill.billNo}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Ngày tạo</h3>
                <p className="text-lg font-medium">{formatDate(bill.date)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Khách hàng</h3>
                <p className="text-lg font-medium">{bill.customer?.name || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Dịch vụ</h3>
                <p className="text-lg font-medium">{bill.service?.name || 'N/A'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tổng doanh thu</h3>
                <p className="text-lg font-medium">{formatCurrency(totalRevenue)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tổng chi phí</h3>
                <p className="text-lg font-medium">{formatCurrency(totalCost)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Lợi nhuận</h3>
                <p className={cn("text-lg font-medium", profit >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatCurrency(profit)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Ghi chú</h3>
                <p className="text-base">{bill.notes || 'Không có ghi chú'}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Cập nhật trạng thái</Label>
              <div className="flex items-center gap-2 mt-2">
                <Select
                  value={status}
                  onValueChange={setStatus}
                >
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
                  onClick={updateStatus} 
                  disabled={isUpdateLoading || status === bill.status}
                >
                  <Save className="mr-2 h-4 w-4" /> Lưu trạng thái
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="costs">
        <TabsList>
          <TabsTrigger value="costs">Chi phí</TabsTrigger>
          <TabsTrigger value="revenues">Doanh thu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chi phí liên quan</CardTitle>
              <CardDescription>
                Danh sách các chi phí liên quan đến hóa đơn này
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Sử dụng component mới */}
              {bill.costs && (
                <CostsTable costs={bill.costs} totalCost={totalCost} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Doanh thu liên quan</CardTitle>
              <CardDescription>
                Danh sách các doanh thu liên quan đến hóa đơn này
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bill.revenues && bill.revenues.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Dịch vụ</th>
                        <th className="text-left py-3 font-medium">Ngày</th>
                        <th className="text-right py-3 font-medium">Số tiền</th>
                        <th className="text-left py-3 font-medium">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.revenues.map((revenue: any) => (
                        <tr key={revenue.id} className="border-b">
                          <td className="py-3">{revenue.service?.name || bill.service?.name || 'N/A'}</td>
                          <td className="py-3">{formatDate(revenue.date)}</td>
                          <td className="py-3 text-right">{formatCurrency(revenue.amount)}</td>
                          <td className="py-3">{revenue.notes || '-'}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50">
                        <td colSpan={2} className="py-3 font-medium">Tổng cộng</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(totalRevenue)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">Không có doanh thu nào được ghi nhận cho hóa đơn này</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}