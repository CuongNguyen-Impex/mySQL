import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange as DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export default function BillDetailReport() {
  const today = new Date();
  const oneMonthAgo = subMonths(today, 1);
  
  const [date, setDate] = useState<DateRange>({
    from: oneMonthAgo,
    to: today
  });

  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : format(oneMonthAgo, 'yyyy-MM-dd');
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'bill-detail', startDate, endDate],
    queryFn: async () => {
      try {
        const fromDate = date?.from ? date.from.toISOString() : oneMonthAgo.toISOString();
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
      const fromDate = date?.from ? date.from.toISOString() : oneMonthAgo.toISOString();
      const toDate = date?.to ? date.to.toISOString() : today.toISOString();
      
      window.open(`/api/reports/bills/export?fromDate=${fromDate}&toDate=${toDate}`, '_blank');
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  // Calculate subtotals by bill and cost type
  const calculateSubtotals = () => {
    if (!data?.bills || !Array.isArray(data.bills)) return { byBill: {}, byCostType: {} };
    
    const byBill = {};
    const byCostType = {};
    
    data.bills.forEach(bill => {
      // Initialize if not exists
      if (!byBill[bill.billNo]) {
        byBill[bill.billNo] = {
          totalCost: 0,
          totalRevenue: 0,
          profit: 0
        };
      }
      
      // Calculate for each bill
      const billCosts = bill.costs || [];
      const billRevenues = bill.revenues || [];
      
      const totalCost = billCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
      const totalRevenue = billRevenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount || 0), 0);
      const profit = totalRevenue - totalCost;
      
      byBill[bill.billNo].totalCost = totalCost;
      byBill[bill.billNo].totalRevenue = totalRevenue;
      byBill[bill.billNo].profit = profit;
      
      // Calculate by cost type
      billCosts.forEach(cost => {
        const costTypeName = cost.costType?.name || 'Không xác định';
        
        if (!byCostType[costTypeName]) {
          byCostType[costTypeName] = {
            totalAmount: 0,
            billCount: 0,
            bills: new Set()
          };
        }
        
        byCostType[costTypeName].totalAmount += parseFloat(cost.amount || 0);
        byCostType[costTypeName].bills.add(bill.billNo);
      });
    });
    
    // Convert sets to counts
    Object.keys(byCostType).forEach(costType => {
      byCostType[costType].billCount = byCostType[costType].bills.size;
      delete byCostType[costType].bills; // Remove the set, we just need the count
    });
    
    return { byBill, byCostType };
  };
  
  const subtotals = calculateSubtotals();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Báo cáo chi tiết theo hóa đơn</h2>
        <div className="flex space-x-2">
          <DateRangePicker date={date} setDate={setDate} />
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hóa đơn</TableHead>
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead>Loại chi phí</TableHead>
                      <TableHead className="text-right">Chi phí</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">Lãi/Lỗ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.bills?.map((bill: any) => (
                      <>
                        {/* Bill info row - with costs */}
                        {bill.costs?.map((cost: any, costIndex: number) => (
                          <TableRow key={`${bill.id}-cost-${costIndex}`}>
                            {costIndex === 0 ? (
                              <TableCell rowSpan={Math.max(1, (bill.costs?.length || 0) + (bill.revenues?.length || 0) + 1)} className="font-medium">
                                {bill.billNo}<br/>
                                <span className="text-xs text-muted-foreground">{bill.date}</span>
                              </TableCell>
                            ) : null}
                            <TableCell>{cost.supplier?.name || 'N/A'}</TableCell>
                            <TableCell>{cost.costType?.name || 'N/A'}</TableCell>
                            <TableCell className="text-right">{parseFloat(cost.amount || 0).toLocaleString('vi-VN')}</TableCell>
                            <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                            {costIndex === 0 ? (
                              <TableCell rowSpan={bill.costs?.length || 1} className="text-right">
                                {/* Show revenue if there are any */}
                                {bill.revenues?.map((revenue: any, idx: number) => (
                                  <div key={`${bill.id}-revenue-${idx}`}>
                                    {parseFloat(revenue.amount || 0).toLocaleString('vi-VN')}
                                  </div>
                                ))}
                              </TableCell>
                            ) : null}
                            {costIndex === 0 ? (
                              <TableCell rowSpan={bill.costs?.length || 1} className="text-right">
                                {/* Profit for each cost compared to total revenue */}
                                {bill.costs?.map((costItem: any, idx: number) => {
                                  const totalRevenue = bill.revenues?.reduce((sum: number, rev: any) => sum + parseFloat(rev.amount || 0), 0) || 0;
                                  const costAmount = parseFloat(costItem.amount || 0);
                                  const profitShare = (totalRevenue / (bill.costs?.length || 1)) - costAmount;
                                  const colorClass = profitShare >= 0 ? 'text-success' : 'text-destructive';
                                  
                                  return (
                                    <div key={`${bill.id}-profit-${idx}`} className={colorClass}>
                                      {profitShare.toLocaleString('vi-VN')}
                                    </div>
                                  );
                                })}
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))}
                        
                        {/* If no costs but has bill */}
                        {(!bill.costs || bill.costs.length === 0) && (
                          <TableRow key={`${bill.id}-no-costs`}>
                            <TableCell className="font-medium">
                              {bill.billNo}<br/>
                              <span className="text-xs text-muted-foreground">{bill.date}</span>
                            </TableCell>
                            <TableCell>N/A</TableCell>
                            <TableCell>N/A</TableCell>
                            <TableCell className="text-right">0</TableCell>
                            <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              {bill.revenues?.map((revenue: any, idx: number) => (
                                <div key={`${bill.id}-revenue-${idx}`}>
                                  {parseFloat(revenue.amount || 0).toLocaleString('vi-VN')}
                                </div>
                              ))}
                            </TableCell>
                            <TableCell className="text-right text-success">
                              {bill.revenues?.reduce((sum: number, rev: any) => sum + parseFloat(rev.amount || 0), 0).toLocaleString('vi-VN') || '0'}
                            </TableCell>
                          </TableRow>
                        )}
                        
                        {/* Subtotal for this bill */}
                        <TableRow key={`${bill.id}-subtotal`} className="bg-muted/50">
                          <TableCell colSpan={3} className="font-medium">Tổng cộng {bill.billNo}</TableCell>
                          <TableCell className="text-right font-medium">
                            {subtotals.byBill[bill.billNo]?.totalCost.toLocaleString('vi-VN') || '0'}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right font-medium">
                            {subtotals.byBill[bill.billNo]?.totalRevenue.toLocaleString('vi-VN') || '0'}
                          </TableCell>
                          <TableCell className={cn("text-right font-medium", 
                            subtotals.byBill[bill.billNo]?.profit >= 0 ? "text-success" : "text-destructive")}>
                            {subtotals.byBill[bill.billNo]?.profit.toLocaleString('vi-VN') || '0'}
                          </TableCell>
                        </TableRow>
                      </>
                    ))}
                    
                    {/* Grand total */}
                    {data?.bills?.length > 0 && (
                      <TableRow className="bg-primary/5 font-bold">
                        <TableCell colSpan={3}>TỔNG CỘNG</TableCell>
                        <TableCell className="text-right">
                          {Object.values(subtotals.byBill).reduce((sum: number, bill: any) => sum + bill.totalCost, 0).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                          {Object.values(subtotals.byBill).reduce((sum: number, bill: any) => sum + bill.totalRevenue, 0).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className={cn("text-right", 
                          Object.values(subtotals.byBill).reduce((sum: number, bill: any) => sum + bill.profit, 0) >= 0 
                            ? "text-success" : "text-destructive")}>
                          {Object.values(subtotals.byBill).reduce((sum: number, bill: any) => sum + bill.profit, 0).toLocaleString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {(data?.bills?.length === 0 || !data?.bills) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
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
                    {Object.entries(subtotals.byCostType).map(([costType, data]: [string, any]) => (
                      <TableRow key={costType}>
                        <TableCell className="font-medium">{costType}</TableCell>
                        <TableCell className="text-right">{data.billCount}</TableCell>
                        <TableCell className="text-right">{data.totalAmount.toLocaleString('vi-VN')}</TableCell>
                        <TableCell className="text-right">
                          {(data.totalAmount / Object.values(subtotals.byCostType).reduce(
                            (sum: number, type: any) => sum + type.totalAmount, 0
                          ) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {Object.keys(subtotals.byCostType).length > 0 && (
                      <TableRow className="bg-primary/5 font-bold">
                        <TableCell>TỔNG CỘNG</TableCell>
                        <TableCell className="text-right">
                          {/* Count unique bills across all cost types */}
                          {data?.bills?.length || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {Object.values(subtotals.byCostType).reduce(
                            (sum: number, type: any) => sum + type.totalAmount, 0
                          ).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    )}
                    
                    {Object.keys(subtotals.byCostType).length === 0 && (
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
