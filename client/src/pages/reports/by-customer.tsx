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

// Định nghĩa kiểu cho dữ liệu khách hàng từ API
interface CustomerReportData {
  id: number;
  name: string;
  billCount: number;
  revenue: string;
  hoaDonCosts: string;
  traHoCosts: string;
  totalCosts: string;
  profit: string;
  margin: number;
  [key: string]: string | number; // Cho phép dữ liệu linh hoạt
}

interface CustomerReportResponse {
  customers: CustomerReportData[];
  timeframe: string;
  dateRange: {
    from: string;
    to: string;
  };
}

export default function ReportsByCustomer() {
  const [timeframe, setTimeframe] = useState("quarter");
  
  // Thiết lập khoảng thời gian mặc định 6 tháng (180 ngày)
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: sixMonthsAgo, 
    to: today 
  });
  
  // Xử lý cập nhật date range từ DatePickerWithRange
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  // Fetch customer report data
  const { data, isLoading } = useQuery<CustomerReportResponse>({
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

  const getProfitClass = (profit: string | number) => {
    const profitNum = typeof profit === 'string' ? parseFloat(profit) : profit;
    if (profitNum > 0) return "text-success";
    if (profitNum < 0) return "text-destructive";
    return "";
  };

  const getMarginClass = (margin: string | number) => {
    const marginNum = typeof margin === 'string' ? parseFloat(margin) : margin;
    if (marginNum >= 30) return "text-success";
    if (marginNum >= 15) return "text-success/80";
    if (marginNum >= 0) return "text-warning";
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
                  setDate={handleDateRangeChange} 
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
                  <TableHead className="text-right">Chi phí (Hóa đơn)</TableHead>
                  <TableHead className="text-right">Chi phí (Trả hộ)</TableHead>
                  <TableHead className="text-right">Tổng chi phí</TableHead>
                  <TableHead className="text-right">Lợi nhuận</TableHead>
                  <TableHead className="text-right">Biên LN %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.customers?.map((customer: CustomerReportData) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right">{customer.billCount}</TableCell>
                    <TableCell className="text-right">{parseFloat(customer.revenue).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-right">{parseFloat(customer.hoaDonCosts || '0').toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-right">{parseFloat(customer.traHoCosts || '0').toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-right">{parseFloat(customer.totalCosts || '0').toLocaleString('vi-VN')}</TableCell>
                    <TableCell className={cn("text-right font-medium", getProfitClass(customer.profit))}>
                      {parseFloat(customer.profit || '0').toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className={cn("text-right", getMarginClass(customer.margin))}>
                      {customer.margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.customers?.length === 0 || !data?.customers) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
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
