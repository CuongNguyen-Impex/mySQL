import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';

export default function BillDetailReport() {
  // Set mặc định khoảng thời gian 3 tháng gần nhất
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });

  // Cần đảm bảo khoảng thời gian luôn được cung cấp cho API
  const fromDate = date?.from || subMonths(new Date(), 3);
  const toDate = date?.to || new Date();
  
  // Fetch dữ liệu báo cáo
  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: [
      '/api/reports/bills',
      { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() }
    ],
  });

  // Xử lý xuất báo cáo
  const handleExport = () => {
    if (!date?.from || !date?.to) return;
    
    const fromDateISO = date.from.toISOString();
    const toDateISO = date.to.toISOString();
    window.open(
      `/api/reports/bills/export?fromDate=${fromDateISO}&toDate=${toDateISO}`,
      '_blank'
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo chi tiết hóa đơn</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full sm:w-[300px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/yyyy", { locale: vi })} -{" "}
                        {format(date.to, "dd/MM/yyyy", { locale: vi })}
                      </>
                    ) : (
                      format(date.from, "dd/MM/yyyy", { locale: vi })
                    )
                  ) : (
                    <span>Chọn khoảng thời gian</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  locale={vi}
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    // Chỉ fetch dữ liệu khi đã chọn đủ khoảng thời gian
                    if (newDate?.from && newDate?.to) {
                      setTimeout(() => refetch(), 100);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleExport}>Xuất báo cáo</Button>
        </div>
      </div>

      <Tabs defaultValue="detail">
        <TabsList>
          <TabsTrigger value="detail">Chi tiết</TabsTrigger>
          <TabsTrigger value="summary">Tóm tắt chi phí</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detail">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết hóa đơn</CardTitle>
              <CardDescription>
                Danh sách chi tiết các chi phí theo từng hóa đơn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">STT</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Số HĐ</TableHead>
                      <TableHead>Loại chi phí</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">Hóa đơn</TableHead>
                      <TableHead className="text-right">Trả hộ</TableHead>
                      <TableHead className="text-right">Lợi nhuận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.bills?.length > 0 ? (
                      <>
                        {/* Hiển thị chi tiết từng bill */}
                        {data.bills.map((bill: any, billIndex: number) => {
                          const billCosts = bill.costs || [];
                          const billRevenues = bill.revenues || [];
                          
                          // Tính tổng doanh thu của bill
                          const totalRevenue = billRevenues.reduce(
                            (sum: number, rev: any) => sum + Number(rev.amount || 0), 
                            0
                          );
                          
                          // Số dòng chi phí trong bill này
                          const costCount = billCosts.length;
                          
                          return (
                            <React.Fragment key={`bill-${bill.id}`}>
                              {/* Hiển thị từng dòng chi phí của hóa đơn này */}
                              {costCount > 0 ? (
                                billCosts.map((cost: any, costIndex: number) => {
                                  // Xác định loại chi phí: Hóa đơn hoặc Trả hộ
                                  const isHoaDon = cost.tt_hd === 'Hóa đơn';
                                  const isTraHo = cost.tt_hd === 'Trả hộ';
                                  
                                  // Số tiền của chi phí hiện tại
                                  const costAmount = Number(cost.amount || 0);
                                  
                                  // Phân bổ doanh thu cho từng chi phí trong bill
                                  // Nếu không có chi phí nào thì hiển thị tất cả doanh thu
                                  const allocatedRevenue = costCount > 0 
                                    ? totalRevenue / costCount 
                                    : totalRevenue;
                                  
                                  // Tính lợi nhuận cho dòng chi phí này
                                  let costProfit;
                                  
                                  if (isHoaDon) {
                                    // Đối với chi phí Hóa đơn, lợi nhuận = doanh thu phân bổ - chi phí
                                    costProfit = allocatedRevenue - costAmount;
                                  } else {
                                    // Đối với chi phí Trả hộ, hiển thị lợi nhuận là doanh thu phân bổ
                                    // vì chi phí Trả hộ không được trừ vào lợi nhuận
                                    costProfit = allocatedRevenue;
                                  }
                                  
                                  return (
                                    <TableRow key={`cost-${cost.id}`}>
                                      <TableCell>{billIndex * costCount + costIndex + 1}</TableCell>
                                      <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                                      <TableCell>{bill.billNo}</TableCell>
                                      <TableCell>{cost.costType?.name || 'N/A'}</TableCell>
                                      <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                                      <TableCell>{cost.supplier?.name || 'N/A'}</TableCell>
                                      <TableCell className="text-right">
                                        {allocatedRevenue.toLocaleString('vi-VN')}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {isHoaDon ? costAmount.toLocaleString('vi-VN') : '0'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {isTraHo ? costAmount.toLocaleString('vi-VN') : '0'}
                                      </TableCell>
                                      <TableCell
                                        className={cn(
                                          "text-right",
                                          costProfit >= 0 ? "text-success" : "text-destructive"
                                        )}
                                      >
                                        {costProfit.toLocaleString('vi-VN')}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                // Trường hợp bill không có chi phí nào
                                <TableRow key={`bill-${bill.id}-no-costs`}>
                                  <TableCell>{billIndex + 1}</TableCell>
                                  <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell>{bill.billNo}</TableCell>
                                  <TableCell>N/A</TableCell>
                                  <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                                  <TableCell>N/A</TableCell>
                                  <TableCell className="text-right">
                                    {totalRevenue.toLocaleString('vi-VN')}
                                  </TableCell>
                                  <TableCell className="text-right">0</TableCell>
                                  <TableCell className="text-right">0</TableCell>
                                  <TableCell className="text-right text-success">
                                    {totalRevenue.toLocaleString('vi-VN')}
                                  </TableCell>
                                </TableRow>
                              )}
                              
                              {/* Dòng tổng cộng cho từng hóa đơn */}
                              <TableRow key={`bill-${bill.id}-summary`} className="bg-muted/50">
                                <TableCell colSpan={2}></TableCell>
                                <TableCell className="font-medium">
                                  Tổng {bill.billNo}
                                </TableCell>
                                <TableCell colSpan={3}></TableCell>
                                <TableCell className="text-right font-medium">
                                  {bill.totalRevenue.toLocaleString('vi-VN')}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {bill.totalHoaDonCost.toLocaleString('vi-VN')}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {bill.totalTraHoCost.toLocaleString('vi-VN')}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "text-right font-medium",
                                    bill.profit >= 0 ? "text-success" : "text-destructive"
                                  )}
                                >
                                  {bill.profit.toLocaleString('vi-VN')}
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                        
                        {/* Dòng tổng cộng cho tất cả các hóa đơn */}
                        <TableRow className="bg-primary/5 font-bold">
                          <TableCell colSpan={2}></TableCell>
                          <TableCell className="font-bold">TỔNG CỘNG</TableCell>
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="text-right font-bold">
                            {data.bills
                              .reduce((sum: number, bill: any) => sum + Number(bill.totalRevenue || 0), 0)
                              .toLocaleString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {data.bills
                              .reduce((sum: number, bill: any) => sum + Number(bill.totalHoaDonCost || 0), 0)
                              .toLocaleString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {data.bills
                              .reduce((sum: number, bill: any) => sum + Number(bill.totalTraHoCost || 0), 0)
                              .toLocaleString('vi-VN')}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-bold",
                              data.bills.reduce((sum: number, bill: any) => sum + Number(bill.profit || 0), 0) >= 0
                                ? "text-success"
                                : "text-destructive"
                            )}
                          >
                            {data.bills
                              .reduce((sum: number, bill: any) => sum + Number(bill.profit || 0), 0)
                              .toLocaleString('vi-VN')}
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                          Không có dữ liệu cho khoảng thời gian đã chọn
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt theo loại chi phí</CardTitle>
              <CardDescription>
                Tổng hợp chi phí theo từng hạng mục
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
                      <TableHead className="text-right">Số hóa đơn</TableHead>
                      <TableHead className="text-right">Tổng chi phí</TableHead>
                      <TableHead className="text-right">Tỷ lệ %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Tạo bảng thống kê theo loại chi phí
                      const costTypeSummary: Array<{
                        costTypeId: number;
                        costTypeName: string;
                        billCount: number;
                        totalAmount: number;
                        percentage: number;
                      }> = [];
                      
                      const costTypeMap = new Map();
                      let totalCost = 0;
                      
                      // Tính toán tổng chi phí theo từng loại
                      data?.bills?.forEach((bill: any) => {
                        (bill.costs || []).forEach((cost: any) => {
                          const costTypeId = cost.costType?.id || 0;
                          const costTypeName = cost.costType?.name || 'Không xác định';
                          const amount = Number(cost.amount || 0);
                          totalCost += amount;
                          
                          if (!costTypeMap.has(costTypeId)) {
                            costTypeMap.set(costTypeId, {
                              costTypeId,
                              costTypeName,
                              billCount: 0,
                              billIds: new Set(),
                              totalAmount: 0,
                            });
                          }
                          
                          const summary = costTypeMap.get(costTypeId);
                          summary.totalAmount += amount;
                          summary.billIds.add(bill.id);
                        });
                      });
                      
                      // Chuyển đổi sang mảng và tính phần trăm
                      costTypeMap.forEach((summary) => {
                        summary.billCount = summary.billIds.size;
                        summary.percentage = totalCost > 0 ? (summary.totalAmount / totalCost) * 100 : 0;
                        costTypeSummary.push(summary);
                      });
                      
                      // Sắp xếp theo tổng chi phí giảm dần
                      return costTypeSummary.sort(
                        (a, b) => b.totalAmount - a.totalAmount
                      );
                    })().map((item: any) => (
                      <TableRow key={`costType-${item.costTypeId}`}>
                        <TableCell className="font-medium">{item.costTypeName}</TableCell>
                        <TableCell className="text-right">{item.billCount}</TableCell>
                        <TableCell className="text-right">
                          {item.totalAmount.toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Tổng cộng */}
                    {data?.bills?.length > 0 && (
                      <TableRow className="bg-primary/5 font-bold">
                        <TableCell className="font-bold">TỔNG CỘNG</TableCell>
                        <TableCell className="text-right font-bold">
                          {data.bills.length}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {data.bills
                            .reduce(
                              (sum: number, bill: any) =>
                                sum +
                                (bill.costs || []).reduce(
                                  (s: number, cost: any) => s + Number(cost.amount || 0),
                                  0
                                ),
                              0
                            )
                            .toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right font-bold">100%</TableCell>
                      </TableRow>
                    )}
                    
                    {(!data?.bills || data.bills.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Không có dữ liệu cho khoảng thời gian đã chọn
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
    </div>
  );
}
