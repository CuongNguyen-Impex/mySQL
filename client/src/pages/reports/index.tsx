import { Link } from "wouter";
import { BarChart3, Users, Store, Wallet, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const reports = [
    {
      title: "Theo khách hàng",
      description: "Phân tích hiệu suất theo khách hàng bao gồm tổng hóa đơn, doanh thu, chi phí và lợi nhuận/lỗ",
      icon: <Users className="h-6 w-6" />,
      href: "/reports/by-customer",
    },
    {
      title: "Theo nhà cung cấp",
      description: "Xem chi phí chi tiết theo nhà cung cấp để tối ưu hóa quá trình mua hàng",
      icon: <Store className="h-6 w-6" />,
      href: "/reports/by-supplier",
    },
    {
      title: "Lợi nhuận & Lỗ",
      description: "Báo cáo lợi nhuận và lỗ đầy đủ cho bất kỳ khoảng thời gian",
      icon: <Wallet className="h-6 w-6" />,
      href: "/reports/profit-loss",
    },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo</h1>
          <p className="text-muted-foreground">
            Phân tích hoạt động logistics với các báo cáo chi tiết
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
                  Xem báo cáo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6">Báo cáo nhanh</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Tổng quan hiệu suất</span>
            </CardTitle>
            <CardDescription>
              Lược tả hiệu suất kinh doanh của bạn trong 30 ngày qua
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-success">10.485.250</p>
                <p className="text-xs text-success flex items-center mt-1">
                  <span>↑ 8% so với tháng trước</span>
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground">Tổng chi phí</p>
                <p className="text-2xl font-bold text-destructive">6.321.800</p>
                <p className="text-xs text-destructive flex items-center mt-1">
                  <span>↑ 3% so với tháng trước</span>
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground">Lợi nhuận ròng</p>
                <p className="text-2xl font-bold text-primary">4.163.450</p>
                <p className="text-xs text-success flex items-center mt-1">
                  <span>↑ 15% so với tháng trước</span>
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/reports/profit-loss">
              <Button variant="link" className="px-0">
                Xem báo cáo lợi nhuận & lỗ chi tiết
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
