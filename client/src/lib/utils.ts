import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined, options: { precision?: number, symbol?: string } = {}): string {
  if (value === null || value === undefined) return "";
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "";
  
  const precision = options.precision ?? 2;
  const symbol = options.symbol ?? '$';
  
  return `${symbol}${numValue.toFixed(precision)}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj instanceof Date && !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString()
      : '';
  } catch {
    return '';
  }
}

export function getStatusColor(status: string | null | undefined): string {
  if (!status) return "";
  
  const statusMap: Record<string, string> = {
    "Completed": "status-badge-completed",
    "Pending": "status-badge-pending",
    "In Progress": "status-badge-in-progress",
    "Cancelled": "status-badge-cancelled",
  };
  
  return statusMap[status] || "";
}

export function getProfitColorClass(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
}

export function getMarginColorClass(margin: number): string {
  if (margin >= 30) return "text-success";
  if (margin >= 15) return "text-success/80";
  if (margin >= 0) return "text-warning";
  return "text-destructive";
}
