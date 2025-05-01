import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange as DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export default function BillDetailReport() {
  const today = new Date();
  // Thiết lập khoảng thời gian mặc định 6 tháng để đảm bảo hiển thị đủ dữ liệu hóa đơn cũ
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const [date, setDate] = useState<DateRange>({
    from: sixMonthsAgo,
    to: today
  });

  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : format(sixMonthsAgo, 'yyyy-MM-dd');
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'bill-detail', startDate, endDate],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/reports/bills?fromDate=${startDate}&toDate=${endDate}`);
      return await response.json();
    }
  });

  const handleExport = async () => {
    const response = await apiRequest(
      'GET', 
      `/api/reports/bills/export?fromDate=${startDate}&toDate=${endDate}`
    );
    
    // Create download link
    const url = window.URL.createObjectURL(await response.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-detail-report-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDateChange = (dateRange: DateRange | undefined) => {
    if (dateRange) {
      setDate(dateRange);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo chi tiết hóa đơn</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleExport}
            disabled={isLoading || !data || data.bills?.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
        <Card className="w-full sm:w-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-md font-medium">Bộ lọc</CardTitle>
            <CardDescription>
              Lọc theo thời gian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <DateRangePicker
                  date={date}
                  setDate={handleDateChange}
                />
              </div>
              <Button onClick={() => refetch()} className="w-full sm:w-auto">
                <FilterIcon className="mr-2 h-4 w-4" />
                Lọc dữ liệu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Chi tiết hóa đơn</TabsTrigger>
          <TabsTrigger value="summary">Tóm tắt chi phí</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết chi phí và doanh thu theo hóa đơn</CardTitle>
              <CardDescription>
                Từ ngày {format(new Date(startDate), 'dd/MM/yyyy')} đến {format(new Date(endDate), 'dd/MM/yyyy')}
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
                      <TableHead>STT</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Số bill</TableHead>
                      <TableHead>Loại chi phí</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead className="text-right">Giá bán</TableHead>
                      <TableHead className="text-right">Giá mua</TableHead>
                      <TableHead className="text-right">Lãi/Lỗ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Counter for maintaining a single continuous sequence number
                      let rowNumber = 0;
                      
                      return data?.bills?.map((bill: any, billIndex: number) => {
                        // Pre-calculate bill totals
                        const billCosts = bill.costs || [];
                        const billRevenues = bill.revenues || [];
                        const totalCost = billCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount || 0), 0);
                        const totalRevenue = billRevenues.reduce((sum: number, rev: any) => sum + parseFloat(rev.amount || 0), 0);
                        const totalProfit = totalRevenue - totalCost;
                              
                        return (
                          <React.Fragment key={`bill-${bill.id}`}>
                            {/* Cost rows */}
                            {billCosts.map((cost: any, costIndex: number) => {
                              // Calculate revenue per cost if available 
                              const totalCostAmount = parseFloat(cost.amount || 0);
                              const costShare = billCosts.length > 0 ? 1 / billCosts.length : 1;
                              const allocatedRevenue = totalRevenue * costShare;
                              const profit = allocatedRevenue - totalCostAmount;
                              
                              // Increment the global row number
                              rowNumber++;
                              
                              return (
                                <TableRow key={`${bill.id}-cost-${costIndex}`}>
                                  <TableCell>{rowNumber}</TableCell>
                                  <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell>{bill.billNo}</TableCell>
                                  <TableCell>{cost.costType?.name || 'N/A'}</TableCell>
                                  <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                                  <TableCell>{cost.supplier?.name || 'N/A'}</TableCell>
                                  <TableCell className="text-right">{allocatedRevenue.toLocaleString('vi-VN')}</TableCell>
                                  <TableCell className="text-right">{totalCostAmount.toLocaleString('vi-VN')}</TableCell>
                                  <TableCell className={cn("text-right", profit >= 0 ? "text-success" : "text-destructive")}>
                                    {profit.toLocaleString('vi-VN')}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            
                            {/* If no costs but has bill */}
                            {(!billCosts || billCosts.length === 0) && (
                              <TableRow key={`${bill.id}-no-costs`}>
                                <TableCell>{++rowNumber}</TableCell>
                                <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{bill.billNo}</TableCell>
                                <TableCell>N/A</TableCell>
                                <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                                <TableCell>N/A</TableCell>
                                <TableCell className="text-right">{totalRevenue.toLocaleString('vi-VN')}</TableCell>
                                <TableCell className="text-right">0</TableCell>
                                <TableCell className="text-right text-success">{totalRevenue.toLocaleString('vi-VN')}</TableCell>
                              </TableRow>
                            )}
                            
                            {/* Subtotal for this bill */}
                            <TableRow key={`${bill.id}-subtotal`} className="bg-muted/50">
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="font-medium">Tổng cộng {bill.billNo}</TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right font-medium">
                                {totalRevenue.toLocaleString('vi-VN')}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {totalCost.toLocaleString('vi-VN')}
                              </TableCell>
                              <TableCell className={cn("text-right font-medium", 
                                totalProfit >= 0 ? "text-success" : "text-destructive")}>
                                {totalProfit.toLocaleString('vi-VN')}
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      });
                    })()}
                    
                    {/* Grand total */}
                    {data?.bills?.length > 0 && (
                      <TableRow className="bg-primary/5 font-bold">
                        <TableCell colSpan={6}>TỔNG CỘNG</TableCell>
                        <TableCell className="text-right">
                          {data.bills.reduce((sum: number, bill: any) => {
                            const revTotal = (bill.revenues || []).reduce(
                              (s: number, rev: any) => s + parseFloat(rev.amount || 0), 0
                            );
                            return sum + revTotal;
                          }, 0).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          {data.bills.reduce((sum: number, bill: any) => {
                            const costTotal = (bill.costs || []).reduce(
                              (s: number, cost: any) => s + parseFloat(cost.amount || 0), 0
                            );
                            return sum + costTotal;
                          }, 0).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className={cn("text-right", 
                          data.bills.reduce((sum: number, bill: any) => {
                            const revTotal = (bill.revenues || []).reduce(
                              (s: number, rev: any) => s + parseFloat(rev.amount || 0), 0
                            );
                            const costTotal = (bill.costs || []).reduce(
                              (s: number, cost: any) => s + parseFloat(cost.amount || 0), 0
                            );
                            return sum + (revTotal - costTotal);
                          }, 0) >= 0 ? "text-success" : "text-destructive")}>
                          {data.bills.reduce((sum: number, bill: any) => {
                            const revTotal = (bill.revenues || []).reduce(
                              (s: number, rev: any) => s + parseFloat(rev.amount || 0), 0
                            );
                            const costTotal = (bill.costs || []).reduce(
                              (s: number, cost: any) => s + parseFloat(cost.amount || 0), 0
                            );
                            return sum + (revTotal - costTotal);
                          }, 0).toLocaleString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {(data?.bills?.length === 0 || !data?.bills) && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
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
                      const costTypeSummary: Array<{costTypeId: number, costTypeName: string, billCount: number, totalAmount: number, percentage: number}> = [];
                      const costTypeMap = new Map();
                      let totalCost = 0;
                      
                      // Tính toán tổng chi phí theo từng loại
                      data?.bills?.forEach((bill: any) => {
                        (bill.costs || []).forEach((cost: any) => {
                          const costTypeId = cost.costType?.id;
                          const costTypeName = cost.costType?.name || 'Không xác định';
                          const amount = parseFloat(cost.amount || 0);
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
                      costTypeMap.forEach(summary => {
                        summary.billCount = summary.billIds.size;
                        summary.percentage = totalCost > 0 ? (summary.totalAmount / totalCost) * 100 : 0;
                        costTypeSummary.push(summary);
                      });
                      
                      return costTypeSummary.map((item) => (
                        <TableRow key={item.costTypeId}>
                          <TableCell className="font-medium">{item.costTypeName}</TableCell>
                          <TableCell className="text-right">{item.billCount}</TableCell>
                          <TableCell className="text-right">{item.totalAmount.toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right">
                            {item.percentage.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                    
                    {/* Tổng cộng */}
                    {data?.bills?.length > 0 && (
                      <TableRow className="bg-primary/5 font-bold">
                        <TableCell>TỔNG CỘNG</TableCell>
                        <TableCell className="text-right">
                          {data.bills?.length || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {data.bills.reduce((sum: number, bill: any) => {
                            return sum + (bill.costs || []).reduce(
                              (s: number, cost: any) => s + parseFloat(cost.amount || 0), 0
                            );
                          }, 0).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    )}
                    
                    {(!data?.bills || data.bills.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
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