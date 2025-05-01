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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ReportsByCustomer() {
  const [timeframe, setTimeframe] = useState("month");
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

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
            <h1 className="text-2xl font-bold">Customer Report</h1>
            <p className="text-muted-foreground">
              Performance analysis by customer
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize the report period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="quarter">Last 90 days</SelectItem>
                  <SelectItem value="year">Last 12 months</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timeframe === "custom" && (
              <div className="w-full md:w-2/3">
                <label className="text-sm font-medium mb-1 block">Date Range</label>
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
          <CardTitle>Customer Performance</CardTitle>
          <CardDescription>
            Summary of key metrics for each customer
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
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Bills</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Costs</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.customers?.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right">{customer.billCount}</TableCell>
                    <TableCell className="text-right">${parseFloat(customer.revenue).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${parseFloat(customer.costs).toFixed(2)}</TableCell>
                    <TableCell className={cn("text-right font-medium", getProfitClass(customer.profit))}>
                      ${parseFloat(customer.profit).toFixed(2)}
                    </TableCell>
                    <TableCell className={cn("text-right", getMarginClass(customer.margin))}>
                      {customer.margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.customers?.length === 0 || !data?.customers) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No customer data found for the selected time period
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
