/**
 * THIS COMPONENT HAS BEEN DEPRECATED
 * 
 * Revenue is now calculated automatically from cost_prices
 * and no longer requires manual entry or editing.
 * 
 * See cost-price.controller.ts for the new implementation.
 */

import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CostPriceWithRelations } from "@shared/types";

interface RevenueListProps {
  costPrices?: CostPriceWithRelations[];
  billId: number;
}

export default function RevenueList({ costPrices, billId }: RevenueListProps) {
  return (
    <Alert>
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Revenue Display Changed</AlertTitle>
      <AlertDescription>
        Revenue is now calculated automatically from cost prices and displayed in the Bill Summary section.
        To manage pricing for different cost types, please use the Cost Price Management interface.
      </AlertDescription>
    </Alert>
  );
}
