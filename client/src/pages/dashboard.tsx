import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import BillList from "@/components/bills/bill-list";
import { Bill } from "@shared/types";

export default function Dashboard() {
  // Fetch dashboard data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  // Fetch bills
  const { data: billsData, isLoading: isLoadingBills } = useQuery({
    queryKey: ["/api/bills?limit=5"],
  });
  
  const bills = billsData?.bills || [];

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your logistics operations
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Link href="/bills">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Bill
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <>
            <StatsCard.Skeleton />
            <StatsCard.Skeleton />
            <StatsCard.Skeleton />
            <StatsCard.Skeleton />
          </>
        ) : (
          <>
            <StatsCard 
              title="Total Bills"
              value={dashboard?.totalBills || 0}
              icon="receipt"
              trend={dashboard?.billsTrend || 0}
            />
            <StatsCard 
              title="Total Revenue"
              value={(dashboard?.totalRevenue || 0).toFixed(2)}
              prefix="$"
              icon="payments"
              trend={dashboard?.revenueTrend || 0}
            />
            <StatsCard 
              title="Total Costs"
              value={(dashboard?.totalCosts || 0).toFixed(2)}
              prefix="$"
              icon="money_off"
              trend={dashboard?.costsTrend || 0}
              trendReversed
            />
            <StatsCard 
              title="Profit"
              value={(dashboard?.totalProfit || 0).toFixed(2)}
              prefix="$"
              icon="insights"
              trend={dashboard?.profitTrend || 0}
            />
          </>
        )}
      </div>
      
      {/* Recent Bills */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <BillList 
          bills={bills}
          isLoading={isLoadingBills}
          showActions={true}
        />
        <CardFooter className="flex justify-between px-6 py-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {bills.length} of {dashboard?.totalBills || 0} bills
          </p>
          <Link href="/bills">
            <Button variant="link">View All Bills</Button>
          </Link>
        </CardFooter>
      </Card>
      
      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Customer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Performance by Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <PerformanceChart 
                data={dashboard?.customerPerformance || []}
                valueKey="profit"
                nameKey="name"
              />
            )}
          </CardContent>
        </Card>
        
        {/* By Service */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Performance by Service</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <PerformanceChart 
                data={dashboard?.servicePerformance || []}
                valueKey="profit"
                nameKey="name"
                barColor="primary"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
