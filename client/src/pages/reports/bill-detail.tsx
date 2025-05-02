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
      try {
        const fromDate = date?.from ? date.from.toISOString() : sixMonthsAgo.toISOString();
        const toDate = date?.to ? date.to.toISOString() : today.toISOString();

        const res = await apiRequest('GET', `/api/reports/bills?fromDate=${fromDate}&toDate=${toDate}`);

        if (res.ok) {
          const data = await res.json();
          return data;
        }
        
        throw new Error('Error fetching data');
      } catch (error) {
        console.error('Error fetching detail report:', error);
        return {};
      }
    }
  });

  const exportReport = async () => {
    try {
      const fromDate = date?.from ? date.from.toISOString() : sixMonthsAgo.toISOString();
      const toDate = date?.to ? date.to.toISOString() : today.toISOString();
      
      window.open(`/api/reports/bills/export?fromDate=${fromDate}&toDate=${toDate}`, '_blank');
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Báo cáo chi tiết theo hóa đơn</h2>
        <div className="flex space-x-2">
          <DateRangePicker date={date} setDate={(value) => setDate(value || { from: sixMonthsAgo, to: today })} />
          <Button variant="outline" onClick={() => refetch()}>
            <FilterIcon className="mr-2 h-4 w-4" />
            Lọc
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="table">Chi tiết hóa đơn</TabsTrigger>
          <TabsTrigger value="summary">Tóm tắt chi phí</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết chi phí và doanh thu theo hóa đơn</CardTitle>
              <CardDescription>
                Thông tin chi tiết về chi phí, doanh thu và lợi nhuận của từng hóa đơn
              </CardDescription>
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
                <Table className="bill-detail-table">
                  <TableHeader>
                    <TableRow className="header-row">
                      <TableHead rowSpan={2}>STT</TableHead>
                      <TableHead rowSpan={2}>Ngày</TableHead>
                      <TableHead rowSpan={2}>Số bill</TableHead>
                      <TableHead rowSpan={2}>Loại chi phí</TableHead>
                      <TableHead rowSpan={2}>Khách hàng</TableHead>
                      <TableHead rowSpan={2}>Nhà cung cấp</TableHead>
                      <TableHead className="text-right" rowSpan={2}>Giá bán</TableHead>
                      <TableHead className="text-center header-giamua" colSpan={2}>Giá mua</TableHead>
                      <TableHead className="text-right" rowSpan={2}>Lãi/Lỗ</TableHead>
                    </TableRow>
                    <TableRow className="header-row">
                      <TableHead className="text-right">Hóa đơn</TableHead>
                      <TableHead className="text-right">Trả hộ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.bills?.map((bill: any, billIndex: number) => {
                      // Counter for maintaining a single continuous sequence number
                      let rowNumber = 0;
                        // Sử dụng dữ liệu đã tính toán từ API
                        const billCosts = bill.costs || [];
                        const billRevenues = bill.revenues || [];
                        const totalRevenue = bill.totalRevenue || 0;
                        const totalHoaDonCost = bill.totalHoaDonCost || 0;
                        const totalTraHoCost = bill.totalTraHoCost || 0;
                        const totalCost = bill.totalCost || 0;
                        const totalProfit = bill.profit || 0;
                              
                        return (
                          <React.Fragment key={`bill-${bill.id}`}>
                            {/* Cost rows */}
                            {billCosts.map((cost: any, costIndex: number) => {
                              // Calculate revenue per cost if available 
                              const totalCostAmount = parseFloat(cost.amount || 0);
                              const costShare = billCosts.length > 0 ? 1 / billCosts.length : 1;
                              const allocatedRevenue = totalRevenue * costShare;
                              
                              // Xác định loại thuộc tính chi phí
                              const costAttribute = cost.attribute || 'Hóa đơn';
                              const isHoaDon = costAttribute === 'Hóa đơn';
                              const isTraHo = costAttribute === 'Trả hộ';
                              
                              // Tính lợi nhuận dựa trên chi phí "Hóa đơn"
                              const profit = allocatedRevenue - (isHoaDon ? totalCostAmount : 0);
                              
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
                                <TableCell className="text-right">{isHoaDon ? totalCostAmount.toLocaleString('vi-VN') : '0'}</TableCell>
                                <TableCell className="text-right">{isTraHo ? totalCostAmount.toLocaleString('vi-VN') : '0'}</TableCell>
                                <TableCell className={cn("text-right", profit >= 0 ? "text-success" : "text-destructive")}>
                                  {profit.toLocaleString('vi-VN')}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* If no costs but has bill */}
                          {(!billCosts || billCosts.length === 0) && (
                            <TableRow key={`${bill.id}-no-costs`}>
                              <TableCell>1</TableCell>
                              <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>{bill.billNo}</TableCell>
                              <TableCell>N/A</TableCell>
                              <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                              <TableCell>N/A</TableCell>
                              <TableCell className="text-right">{totalRevenue.toLocaleString('vi-VN')}</TableCell>
                              <TableCell className="text-right">0</TableCell>
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
                              {bill.totalHoaDonCost ? bill.totalHoaDonCost.toLocaleString('vi-VN') : '0'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {bill.totalTraHoCost ? bill.totalTraHoCost.toLocaleString('vi-VN') : '0'}
                            </TableCell>
                            <TableCell className={cn("text-right font-medium", 
                              totalProfit >= 0 ? "text-success" : "text-destructive")}>
                              {totalProfit.toLocaleString('vi-VN')}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                    
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
                            return sum + (bill.totalHoaDonCost || 0);
                          }, 0).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          {data.bills.reduce((sum: number, bill: any) => {
                            return sum + (bill.totalTraHoCost || 0);
                          }, 0).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className={cn("text-right", 
                          data.bills.reduce((sum: number, bill: any) => {
                            return sum + (bill.profit || 0);
                          }, 0) >= 0 ? "text-success" : "text-destructive")}>
                          {data.bills.reduce((sum: number, bill: any) => {
                            return sum + (bill.profit || 0);
                          }, 0).toLocaleString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {(data?.bills?.length === 0 || !data?.bills) && (
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
                    {/* Tính toán summary từ dữ liệu trả về */}
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
                        summary.percentage = (summary.totalAmount / totalCost) * 100;
                        costTypeSummary.push(summary);
                      });
                      
                      return costTypeSummary;
                    })().map((item: any) => (
                      <TableRow key={item.costTypeId}>
                        <TableCell className="font-medium">{item.costTypeName}</TableCell>
                        <TableCell className="text-right">{item.billCount}</TableCell>
                        <TableCell className="text-right">{item.totalAmount.toLocaleString('vi-VN')}</TableCell>
                        <TableCell className="text-right">
                          {item.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                    
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
