import { getProfitColorClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PerformanceChartProps {
  data: any[];
  valueKey: string;
  nameKey: string;
  barColor?: "primary" | "success";
}

export function PerformanceChart({
  data = [],
  valueKey,
  nameKey,
  barColor = "success",
}: PerformanceChartProps) {
  // Find the maximum value for calculating percentages
  const maxValue = Math.max(...data.map(item => Math.abs(parseFloat(item[valueKey] || 0))), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const value = parseFloat(item[valueKey] || 0);
        const percentage = Math.min(Math.abs(value) / maxValue * 100, 100);
        const colorClass = barColor === "primary" ? "bg-primary" : "bg-success";
        const valueColorClass = getProfitColorClass(value);
        
        return (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{item[nameKey]}</span>
              <span className={cn("text-sm", valueColorClass)}>{value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div 
                className={cn("h-2 rounded-full", colorClass)} 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
      
      {data.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
