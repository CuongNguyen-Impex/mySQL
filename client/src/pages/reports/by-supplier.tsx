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

export default function ReportsBySupplier() {
  const [timeframe, setTimeframe] = useState("quarter");
  
  // Thiết lập khoảng thời gian mặc định 6 tháng (180 ngày)
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: sixMonthsAgo, 
    to: today 
  });
  const [costTypeFilter, setCostTypeFilter] = useState("");

  // Fetch supplier report data
  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/reports/by-supplier", 
      timeframe, 
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      costTypeFilter
    ],
  });

  // Fetch cost types for filter
  const { data: costTypes } = useQuery({
    queryKey: ["/api/cost-types"],
  });

  // Handle export to Excel/CSV
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/reports/by-supplier/export?timeframe=${timeframe}${
        dateRange.from ? `&from=${dateRange.from.toISOString()}` : ""
      }${dateRange.to ? `&to=${dateRange.to.toISOString()}` : ""
      }${costTypeFilter ? `&costTypeId=${costTypeFilter}` : ""
      }`, {
        credentials: "include",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "supplier-report.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting report:", error);
    }
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
            <h1 className="text-2xl font-bold">Báo cáo chi phí nhà cung cấp</h1>
            <p className="text-muted-foreground">
              Phân tích chi phí theo từng nhà cung cấp
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
          <CardDescription>Tùy chỉnh thời gian và loại chi phí</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4">
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
              <div className="w-full md:w-2/4">
                <label className="text-sm font-medium mb-1 block">Khoảng ngày</label>
                <DatePickerWithRange 
                  date={dateRange} 
                  setDate={(date) => setDateRange(date || { from: undefined, to: undefined })} 
                />
              </div>
            )}
            
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium mb-1 block">Loại chi phí</label>
              <Select value={costTypeFilter} onValueChange={setCostTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả loại chi phí" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_cost_types">Tất cả loại chi phí</SelectItem>
                  {costTypes?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi phí nhà cung cấp</CardTitle>
          <CardDescription>
            Tổng hợp chi phí theo từng nhà cung cấp
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
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Loại chi phí</TableHead>
                  <TableHead className="text-right">Số giao dịch</TableHead>
                  <TableHead className="text-right">Tổng chi phí</TableHead>
                  <TableHead className="text-right">Chi phí trung bình</TableHead>
                  <TableHead className="text-right">Tỉ lệ %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.suppliers?.map((supplier: any) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.costTypeNames.join(", ")}</TableCell>
                    <TableCell className="text-right">{supplier.transactionCount}</TableCell>
                    <TableCell className="text-right font-medium">{parseFloat(supplier.totalAmount).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-right">{parseFloat(supplier.averageCost).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-right">{supplier.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                {(data?.suppliers?.length === 0 || !data?.suppliers) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No supplier data found for the selected time period
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
