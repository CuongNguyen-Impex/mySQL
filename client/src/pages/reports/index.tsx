import { Link } from "wouter";
import { BarChart3, Users, Store, Wallet, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const reports = [
    {
      title: "By Customer",
      description: "Analyze performance by customer including total bills, revenue, costs, and profit/loss",
      icon: <Users className="h-6 w-6" />,
      href: "/reports/by-customer",
    },
    {
      title: "By Supplier",
      description: "View expenses breakdown by supplier to optimize your procurement",
      icon: <Store className="h-6 w-6" />,
      href: "/reports/by-supplier",
    },
    {
      title: "Profit & Loss",
      description: "Complete profit and loss reports for any time period",
      icon: <Wallet className="h-6 w-6" />,
      href: "/reports/profit-loss",
    },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your logistics operations with detailed reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 rounded-full bg-primary/10 text-primary">
                  {report.icon}
                </span>
              </div>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={report.href}>
                <Button variant="outline" className="w-full">
                  View Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6">Quick Reports</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance Overview</span>
            </CardTitle>
            <CardDescription>
              Snapshot of your business performance over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-success">$10,485.25</p>
                <p className="text-xs text-success flex items-center mt-1">
                  <span>↑ 8% from previous month</span>
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground">Total Costs</p>
                <p className="text-2xl font-bold text-destructive">$6,321.80</p>
                <p className="text-xs text-destructive flex items-center mt-1">
                  <span>↑ 3% from previous month</span>
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-primary">$4,163.45</p>
                <p className="text-xs text-success flex items-center mt-1">
                  <span>↑ 15% from previous month</span>
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/reports/profit-loss">
              <Button variant="link" className="px-0">
                View detailed profit & loss report
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
