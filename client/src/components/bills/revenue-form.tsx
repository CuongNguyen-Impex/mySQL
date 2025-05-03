/**
 * THIS COMPONENT HAS BEEN DEPRECATED
 * 
 * Revenue is now calculated automatically from cost_prices
 * and no longer requires manual entry or editing.
 * 
 * See cost-price.controller.ts for the new implementation.
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// This is a placeholder component that displays a deprecation notice
// The actual revenue form functionality has been removed in favor of 
// automatic calculation based on cost_prices entries

interface RevenueFormProps {
  billId: number;
  customerId?: number;
  onSuccess?: () => void;
}

export default function RevenueForm({ billId, customerId, onSuccess }: RevenueFormProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Component Deprecated</AlertTitle>
      <AlertDescription>
        Revenue is now calculated automatically from cost prices and no longer requires manual entry.
        Please use the cost prices management interface to set up pricing for cost types.
      </AlertDescription>
    </Alert>
  );
}
