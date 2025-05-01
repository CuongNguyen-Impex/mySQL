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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ProfitLossReport() {
  const [timeframe, setTimeframe] = useState("month");
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

  // Fetch profit/loss report data
  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/reports/profit-loss", 
      timeframe, 
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString()
    ],
  });

  // Handle export to Excel/CSV
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/reports/profit-loss/export?timeframe=${timeframe}${
        dateRange.from ? `&from=${dateRange.from.toISOString()}` : ""
      }${dateRange.to ? `&to=${dateRange.to.toISOString()}` : ""
      }`, {
        credentials: "include",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "profit-loss-report.csv";
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
            <h1 className="text-2xl font-bold">Profit & Loss Report</h1>
            <p className="text-muted-foreground">
              Comprehensive profit and loss analysis
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-success">
                ${(data?.summary?.totalRevenue || 0).toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                ${(data?.summary?.totalCosts || 0).toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className={cn("text-2xl font-bold", getProfitClass(data?.summary?.netProfit || 0))}>
                ${(data?.summary?.netProfit || 0).toFixed(2)}
                <span className="text-sm font-normal ml-2">
                  ({(data?.summary?.profitMargin || 0).toFixed(1)}%)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Period Breakdown</CardTitle>
              <CardDescription>
                Profit and loss breakdown by period
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
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Bills</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Costs</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.periods?.map((period: any) => (
                      <TableRow key={period.label}>
                        <TableCell className="font-medium">{period.label}</TableCell>
                        <TableCell className="text-right">{period.billCount}</TableCell>
                        <TableCell className="text-right">${parseFloat(period.revenue).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${parseFloat(period.costs).toFixed(2)}</TableCell>
                        <TableCell className={cn("text-right font-medium", getProfitClass(period.profit))}>
                          ${parseFloat(period.profit).toFixed(2)}
                        </TableCell>
                        <TableCell className={cn("text-right", getMarginClass(period.margin))}>
                          {period.margin.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    {(data?.periods?.length === 0 || !data?.periods) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No data found for the selected time period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Profit and Loss Trend</CardTitle>
              <CardDescription>
                Visual representation of profit and loss over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 w-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.periods || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--success))" />
                      <Bar dataKey="costs" name="Costs" fill="hsl(var(--destructive))" />
                      <Bar dataKey="profit" name="Profit" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
