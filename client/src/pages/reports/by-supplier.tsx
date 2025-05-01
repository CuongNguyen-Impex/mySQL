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

export default function ReportsBySupplier() {
  const [timeframe, setTimeframe] = useState("month");
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
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
            <h1 className="text-2xl font-bold">Supplier Expenses Report</h1>
            <p className="text-muted-foreground">
              Analysis of expenses by supplier
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
          <CardDescription>Customize the report period and cost type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4">
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
              <div className="w-full md:w-2/4">
                <label className="text-sm font-medium mb-1 block">Date Range</label>
                <DatePickerWithRange 
                  date={dateRange} 
                  setDate={setDateRange} 
                />
              </div>
            )}
            
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium mb-1 block">Cost Type</label>
              <Select value={costTypeFilter} onValueChange={setCostTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All cost types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_cost_types">All cost types</SelectItem>
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
          <CardTitle>Supplier Expenses</CardTitle>
          <CardDescription>
            Summary of expenses by supplier
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
                  <TableHead>Supplier</TableHead>
                  <TableHead>Cost Types</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Average Cost</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.suppliers?.map((supplier: any) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.costTypeNames.join(", ")}</TableCell>
                    <TableCell className="text-right">{supplier.transactionCount}</TableCell>
                    <TableCell className="text-right font-medium">${parseFloat(supplier.totalAmount).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${parseFloat(supplier.averageCost).toFixed(2)}</TableCell>
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
