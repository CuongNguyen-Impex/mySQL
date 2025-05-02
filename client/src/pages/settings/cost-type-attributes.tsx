import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CostTypeAttributeForm from "@/components/cost-types/cost-type-attribute-form";
import { CostTypeAttributeWithRelations } from "@shared/types";

export default function CostTypeAttributesPage() {
  const { toast } = useToast();
  const [selectedCostTypeId, setSelectedCostTypeId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<CostTypeAttributeWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch cost types
  const { data: costTypes = [] } = useQuery({
    queryKey: ["/api/cost-types"],
  });

  // Fetch attributes
  const { data: attributes = [], isLoading } = useQuery<CostTypeAttributeWithRelations[]>({
    queryKey: ["/api/cost-type-attributes"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/cost-type-attributes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/cost-type-attributes"],
      });
      toast({
        title: "Xóa thành công",
        description: "Thuộc tính đã được xóa.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: `Không thể xóa thuộc tính: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter attributes based on selected cost type and search query
  const filteredAttributes = attributes.filter((attr) => {
    let matchesCostType = true;
    if (selectedCostTypeId !== "all") {
      matchesCostType = attr.costTypeId === parseInt(selectedCostTypeId);
    }

    let matchesSearch = true;
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      matchesSearch =
        attr.name.toLowerCase().includes(query) ||
        attr.costType?.name.toLowerCase().includes(query);
    }

    return matchesCostType && matchesSearch;
  });

  const handleEdit = (attribute: CostTypeAttributeWithRelations) => {
    setSelectedAttribute(attribute);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (attribute: CostTypeAttributeWithRelations) => {
    setSelectedAttribute(attribute);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAttribute) {
      deleteMutation.mutate(selectedAttribute.id);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý thuộc tính loại chi phí</h1>
          <p className="text-muted-foreground">
            Thêm và quản lý các thuộc tính cho từng loại chi phí
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm thuộc tính
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm thuộc tính mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin cho thuộc tính loại chi phí mới
              </DialogDescription>
            </DialogHeader>
            <CostTypeAttributeForm
              onSuccess={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thuộc tính</CardTitle>
          <CardDescription>Quản lý tất cả các thuộc tính loại chi phí</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-1/3">
              <Select
                value={selectedCostTypeId}
                onValueChange={setSelectedCostTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo loại chi phí" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại chi phí</SelectItem>
                  {costTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-2/3">
              <Input
                placeholder="Tìm kiếm theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tên thuộc tính</TableHead>
                  <TableHead>Loại chi phí</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : filteredAttributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Không tìm thấy dữ liệu thuộc tính
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttributes.map((attribute) => (
                    <TableRow key={attribute.id}>
                      <TableCell>{attribute.id}</TableCell>
                      <TableCell>{attribute.name}</TableCell>
                      <TableCell>{attribute.costType?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(attribute)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deleteDialogOpen && selectedAttribute?.id === attribute.id}
                            onOpenChange={(open) => {
                              if (!open) setDeleteDialogOpen(false);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDelete(attribute)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Xác nhận xóa thuộc tính
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc muốn xóa thuộc tính "{attribute.name}"?
                                  Dữ liệu đã xóa không thể khôi phục.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={confirmDelete}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa thuộc tính</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin thuộc tính
            </DialogDescription>
          </DialogHeader>
          {selectedAttribute && (
            <CostTypeAttributeForm
              attribute={selectedAttribute}
              onSuccess={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
