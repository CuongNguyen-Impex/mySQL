import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Revenue } from "@shared/types";
import RevenueForm from "./revenue-form";

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
