import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon: string;
  trend: number;
  trendReversed?: boolean;
}

export function StatsCard({
  title,
  value,
  prefix = "",
  suffix = "",
  icon,
  trend,
  trendReversed = false,
}: StatsCardProps) {
  const isTrendPositive = trend > 0;
  const trendClass = trendReversed 
    ? (!isTrendPositive ? "text-success" : "text-destructive")
    : (isTrendPositive ? "text-success" : "text-destructive");

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{prefix}{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}{suffix}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-icons">{icon}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className={cn("text-xs flex items-center", trendClass)}>
            {isTrendPositive ? (
              <ArrowUp className="mr-1 h-3 w-3" />
            ) : (
              <ArrowDown className="mr-1 h-3 w-3" />
            )}
            <span>{Math.abs(trend)}% so với tháng trước</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

StatsCard.Skeleton = function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};
