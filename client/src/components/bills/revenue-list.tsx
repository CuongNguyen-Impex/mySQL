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
  revenues: Revenue[];
  billId: number;
  onRevenueChange?: () => void;
}

export default function RevenueList({ revenues, billId, onRevenueChange }: RevenueListProps) {
  const { toast } = useToast();
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const deleteRevenueMutation = useMutation({
    mutationFn: async (revenueId: number) => {
      return apiRequest("DELETE", `/api/revenues/${revenueId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bills/${billId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      if (onRevenueChange) onRevenueChange();
      toast({
        title: "Revenue deleted",
        description: "The revenue record has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete the revenue: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleRevenueUpdateSuccess = () => {
    setIsEditDialogOpen(false);
    if (onRevenueChange) onRevenueChange();
    toast({
      title: "Success",
      description: "Revenue updated successfully",
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revenues.map((revenue) => (
            <TableRow key={revenue.id}>
              <TableCell>{revenue.service?.name || "-"}</TableCell>
              <TableCell>{formatCurrency(revenue.amount)}</TableCell>
              <TableCell>{formatDate(revenue.date)}</TableCell>
              <TableCell>{revenue.notes || "-"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setSelectedRevenue(revenue);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this
                            revenue record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRevenueMutation.mutate(revenue.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {revenues.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No revenues found. Click "Add Revenue" to create one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Revenue Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Revenue</DialogTitle>
            <DialogDescription>
              Update the details for this revenue
            </DialogDescription>
          </DialogHeader>
          {selectedRevenue && (
            <RevenueForm 
              revenue={selectedRevenue} 
              billId={billId} 
              onSuccess={handleRevenueUpdateSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
