import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ReportsByCustomer() {
  const [timeframe, setTimeframe] = useState("quarter");
  
  // Thiết lập khoảng thời gian mặc định 6 tháng (180 ngày)
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ 
    from: sixMonthsAgo, 
    to: today 
  });

  // Fetch customer report data
  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/reports/by-customer",
      timeframe,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString()
    ],
  });

  // Handle export to Excel/CSV
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/reports/by-customer/export?timeframe=${timeframe}${
        dateRange.from ? `&from=${dateRange.from.toISOString()}` : ""
      }${dateRange.to ? `&to=${dateRange.to.toISOString()}` : ""
      }`, {
        credentials: "include",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "customer-report.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const getProfitClass = (profit: number) => {
    if (profit > 0) return "text-success";
    if (profit < 0) return "text-destructive";
    return "";
  };

  const getMarginClass = (margin: number) => {
    if (margin >= 30) return "text-success";
    if (margin >= 15) return "text-success/80";
    if (margin >= 0) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/reports">
            <Button variant="ghost" size="icon" className="mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Báo cáo khách hàng</h1>
            <p className="text-muted-foreground">
              Phân tích hiệu suất theo khách hàng
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Xuất file
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tùy chỉnh kỳ báo cáo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Khoảng thời gian</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khoảng thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">7 ngày gần đây</SelectItem>
                  <SelectItem value="month">30 ngày gần đây</SelectItem>
                  <SelectItem value="quarter">90 ngày gần đây</SelectItem>
                  <SelectItem value="year">12 tháng gần đây</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timeframe === "custom" && (
              <div className="w-full md:w-2/3">
                <label className="text-sm font-medium mb-1 block">Khoảng ngày</label>
                <DatePickerWithRange 
                  date={dateRange} 
                  setDate={setDateRange} 
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hiệu suất khách hàng</CardTitle>
          <CardDescription>
            Tổng hợp các chỉ số quan trọng cho từng khách hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="text-right">Hóa đơn</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                  <TableHead className="text-right">Chi phí</TableHead>
                  <TableHead className="text-right">Lợi nhuận</TableHead>
                  <TableHead className="text-right">Biên lợi nhuận %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.customers?.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right">{customer.billCount}</TableCell>
                    <TableCell className="text-right">{parseFloat(customer.revenue).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-right">{parseFloat(customer.costs).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className={cn("text-right font-medium", getProfitClass(customer.profit))}>
                      {parseFloat(customer.profit).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className={cn("text-right", getMarginClass(customer.margin))}>
                      {customer.margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.customers?.length === 0 || !data?.customers) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Không tìm thấy dữ liệu khách hàng trong khoảng thời gian đã chọn
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
