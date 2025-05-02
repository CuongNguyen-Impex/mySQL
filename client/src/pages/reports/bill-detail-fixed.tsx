import React, { useState } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { vi } from 'date-fns/locale';

import { DateRange } from 'react-day-picker';
import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function BillDetailReport() {
  // Mặc định hiển thị report từ đầu tháng hiện tại
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const [activeTab, setActiveTab] = useState<string>('detail');

  const formatDateParam = (date: Date | undefined) => {
    return date ? format(date, 'yyyy-MM-dd') : '';
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      '/api/reports/bills',
      formatDateParam(dateRange?.from),
      formatDateParam(dateRange?.to),
    ],
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo chi tiết bills</h2>
        <div className="flex items-center gap-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button className="gap-1" variant="outline">
            <Calendar className="h-4 w-4" />
            <span>Xuất Excel</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="detail" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="detail">Chi tiết</TabsTrigger>
            <TabsTrigger value="summary">Tổng hợp</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detail">
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết theo từng bill</CardTitle>
                <CardDescription>
                  Báo cáo chi tiết từng bill cho khoảng thời gian từ {' '}
                  {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy', { locale: vi }) : ''} đến {' '}
                  {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy', { locale: vi }) : ''}
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
                  <div className="w-full overflow-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th rowSpan={2} className="border p-2 text-center">STT</th>
                          <th rowSpan={2} className="border p-2 text-center">Ngày</th>
                          <th rowSpan={2} className="border p-2 text-center">Số bill</th>
                          <th rowSpan={2} className="border p-2 text-center">Số invoice</th>
                          <th rowSpan={2} className="border p-2 text-center">Trọng lượng</th>
                          <th rowSpan={2} className="border p-2 text-center">Số kiện</th>
                          <th rowSpan={2} className="border p-2 text-center">Loại</th>
                          <th rowSpan={2} className="border p-2 text-center">Loại chi phí</th>
                          <th rowSpan={2} className="border p-2 text-center">Khách hàng</th>
                          <th rowSpan={2} className="border p-2 text-center">Nhà cung cấp</th>
                          <th rowSpan={2} className="border p-2 text-center">Giá bán</th>
                          <th colSpan={2} className="border p-2 text-center bg-muted font-bold">Giá mua</th>
                          <th rowSpan={2} className="border p-2 text-center">Lãi/Lỗ</th>
                        </tr>
                        <tr>
                          <th className="border p-2 text-center">Hóa đơn</th>
                          <th className="border p-2 text-center">Trả hộ</th>
                        </tr>
                      </thead>
                      <tbody>
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
                                  
                                  // Xác định loại thuộc tính chi phí
                                  const costAttribute = cost.attribute || 'Hóa đơn';
                                  const isHoaDon = costAttribute === 'Hóa đơn';
                                  const isTraHo = costAttribute === 'Trả hộ';
                                  
                                  // Tính lợi nhuận dựa trên chi phí "Hóa đơn"
                                  const profit = allocatedRevenue - (isHoaDon ? totalCostAmount : 0);
                                  
                                  // Increment the global row number
                                  rowNumber++;
                                  
                                  return (
                                    <tr key={`${bill.id}-cost-${costIndex}`} className="border-b hover:bg-gray-50">
                                      <td className="border p-2 text-center">{rowNumber}</td>
                                      <td className="border p-2">{format(new Date(bill.date), 'dd/MM/yyyy')}</td>
                                      <td className="border p-2">{bill.billNo}</td>
                                      <td className="border p-2">{bill.invoiceNo || '-'}</td>
                                      <td className="border p-2 text-center">-</td>
                                      <td className="border p-2 text-center">{bill.packageCount || '-'}</td>
                                      <td className="border p-2 text-center">{bill.goodsType || '-'}</td>
                                      <td className="border p-2">{cost.costType?.name || 'N/A'}</td>
                                      <td className="border p-2">{bill.customer?.name || 'N/A'}</td>
                                      <td className="border p-2">{cost.supplier?.name || 'N/A'}</td>
                                      <td className="border p-2 text-right">{allocatedRevenue.toLocaleString('vi-VN')}</td>
                                      <td className="border p-2 text-right">{isHoaDon ? totalCostAmount.toLocaleString('vi-VN') : '0'}</td>
                                      <td className="border p-2 text-right">{isTraHo ? totalCostAmount.toLocaleString('vi-VN') : '0'}</td>
                                      <td className={`border p-2 text-right ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {profit.toLocaleString('vi-VN')}
                                      </td>
                                    </tr>
                                  );
                                })}
                                
                                {/* If no costs but has bill */}
                                {(!billCosts || billCosts.length === 0) && (
                                  <tr key={`${bill.id}-no-costs`} className="border-b hover:bg-gray-50">
                                    <td className="border p-2 text-center">1</td>
                                    <td className="border p-2">{format(new Date(bill.date), 'dd/MM/yyyy')}</td>
                                    <td className="border p-2">{bill.billNo}</td>
                                    <td className="border p-2">{bill.invoiceNo || '-'}</td>
                                    <td className="border p-2 text-center">-</td>
                                    <td className="border p-2 text-center">{bill.packageCount || '-'}</td>
                                    <td className="border p-2 text-center">{bill.goodsType || '-'}</td>
                                    <td className="border p-2">N/A</td>
                                    <td className="border p-2">{bill.customer?.name || 'N/A'}</td>
                                    <td className="border p-2">N/A</td>
                                    <td className="border p-2 text-right">{totalRevenue.toLocaleString('vi-VN')}</td>
                                    <td className="border p-2 text-right">0</td>
                                    <td className="border p-2 text-right">0</td>
                                    <td className="border p-2 text-right text-green-600">{totalRevenue.toLocaleString('vi-VN')}</td>
                                  </tr>
                                )}
                                
                                {/* Subtotal for this bill */}
                                <tr key={`${bill.id}-subtotal`} className="bg-gray-100 font-medium">
                                  <td className="border p-2" colSpan={3}></td>
                                  <td className="border p-2 font-medium" colSpan={4}>Tổng cộng {bill.billNo}</td>
                                  <td className="border p-2" colSpan={3}></td>
                                  <td className="border p-2 text-right font-medium">
                                    {totalRevenue.toLocaleString('vi-VN')}
                                  </td>
                                  <td className="border p-2 text-right font-medium">
                                    {bill.totalHoaDonCost ? bill.totalHoaDonCost.toLocaleString('vi-VN') : '0'}
                                  </td>
                                  <td className="border p-2 text-right font-medium">
                                    {bill.totalTraHoCost ? bill.totalTraHoCost.toLocaleString('vi-VN') : '0'}
                                  </td>
                                  <td className={`border p-2 text-right font-medium ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {totalProfit.toLocaleString('vi-VN')}
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          });
                        })()
                        
                        /* Grand total */}
                        {data?.bills?.length > 0 && (
                          <tr className="bg-blue-50 font-bold">
                            <td colSpan={10} className="border p-2">TỔNG CỘNG</td>
                            <td className="border p-2 text-right">
                              {data.bills.reduce((sum: number, bill: any) => {
                                const revTotal = (bill.revenues || []).reduce(
                                  (s: number, rev: any) => s + parseFloat(rev.amount || 0), 0
                                );
                                return sum + revTotal;
                              }, 0).toLocaleString('vi-VN')}
                            </td>
                            <td className="border p-2 text-right">
                              {data.bills.reduce((sum: number, bill: any) => {
                                return sum + (bill.totalHoaDonCost || 0);
                              }, 0).toLocaleString('vi-VN')}
                            </td>
                            <td className="border p-2 text-right">
                              {data.bills.reduce((sum: number, bill: any) => {
                                return sum + (bill.totalTraHoCost || 0);
                              }, 0).toLocaleString('vi-VN')}
                            </td>
                            <td className={`border p-2 text-right ${data.bills.reduce((sum: number, bill: any) => {
                                const revTotal = (bill.revenues || []).reduce(
                                  (s: number, rev: any) => s + parseFloat(rev.amount || 0), 0
                                );
                                // Chỉ tính lợi nhuận dựa trên chi phí "Hóa đơn"
                                return sum + (revTotal - (bill.totalHoaDonCost || 0));
                              }, 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {data.bills.reduce((sum: number, bill: any) => {
                                const revTotal = (bill.revenues || []).reduce(
                                  (s: number, rev: any) => s + parseFloat(rev.amount || 0), 0
                                );
                                // Chỉ tính lợi nhuận dựa trên chi phí "Hóa đơn"
                                return sum + (revTotal - (bill.totalHoaDonCost || 0));
                              }, 0).toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        )}
                        
                        {(data?.bills?.length === 0 || !data?.bills) && (
                          <tr>
                            <td colSpan={10} className="border p-2 text-center py-6 text-gray-500">
                              Không có dữ liệu cho khoảng thời gian đã chọn
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                                billCount: 1,
                                totalAmount: amount,
                              });
                            } else {
                              const item = costTypeMap.get(costTypeId);
                              costTypeMap.set(costTypeId, {
                                ...item,
                                billCount: item.billCount + 1,
                                totalAmount: item.totalAmount + amount,
                              });
                            }
                          });
                        });
                        
                        // Chuyển từ map sang array và tính tỷ lệ %
                        costTypeMap.forEach((value) => {
                          costTypeSummary.push({
                            ...value,
                            percentage: totalCost > 0 ? (value.totalAmount / totalCost) * 100 : 0,
                          });
                        });
                        
                        // Sắp xếp giảm dần theo tổng chi phí
                        costTypeSummary.sort((a, b) => b.totalAmount - a.totalAmount);
                        
                        return costTypeSummary.map((item, index) => (
                          <TableRow key={`cost-type-${item.costTypeId}`}>
                            <TableCell>{item.costTypeName}</TableCell>
                            <TableCell className="text-right">{item.billCount}</TableCell>
                            <TableCell className="text-right">{item.totalAmount.toLocaleString('vi-VN')}</TableCell>
                            <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                          </TableRow>
                        ));
                      })()}
                      
                      {/* Trường hợp không có dữ liệu */}
                      {!data?.bills || data.bills.length === 0 || !data.bills.some((bill: any) => (bill.costs || []).length > 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            Không có dữ liệu chi phí cho khoảng thời gian đã chọn
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
    </div>
  );
}