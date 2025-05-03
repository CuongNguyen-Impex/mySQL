import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Loader2, PenIcon, Trash, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const newUserSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.string().refine(val => ['admin', 'user'].includes(val), 'Phân quyền phải là admin hoặc user'),
});

const permissionsSchema = z.object({
  canManageCategories: z.boolean().default(false),
  canEditBills: z.boolean().default(false),
  canCreateBills: z.boolean().default(false),
  canViewRevenueAndPricing: z.boolean().default(false),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type User = {
  id: number;
  username: string;
  role: string;
  canManageCategories: boolean;
  canEditBills: boolean;
  canCreateBills: boolean;
  canViewRevenueAndPricing: boolean;
};

const UsersTable = ({ users, onEditPermissions, onDeleteUser, onEditPassword }: {
  users: User[];
  onEditPermissions: (user: User) => void;
  onDeleteUser: (userId: number) => void;
  onEditPassword: (userId: number) => void;
}) => {
  if (!users || users.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Không có người dùng nào</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Tên đăng nhập</TableHead>
          <TableHead>Phân quyền</TableHead>
          <TableHead>Quyền hạn chi tiết</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.id}</TableCell>
            <TableCell>{user.username}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                {user.role === 'admin' ? 'Admin' : 'User'}
              </Badge>
            </TableCell>
            <TableCell className="space-x-1">
              {user.canManageCategories && <Badge variant="secondary">Quản lý danh mục</Badge>}
              {user.canEditBills && <Badge variant="secondary">Sửa hóa đơn</Badge>}
              {user.canCreateBills && <Badge variant="secondary">Tạo hóa đơn</Badge>}
              {user.canViewRevenueAndPricing && <Badge variant="secondary">Xem doanh thu & báo giá</Badge>}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => onEditPermissions(user)}
                  disabled={user.role === 'admin'}
                  title={user.role === 'admin' ? 'Admin có đầy đủ quyền hạn' : 'Sửa quyền hạn'}
                >
                  <PenIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onEditPassword(user.id)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => onDeleteUser(user.id)}
                  disabled={user.role === 'admin' && user.id === 1} // Không cho phép xóa tài khoản admin gốc
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default function SettingsUsers() {
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState<boolean>(false);
  const [isEditPermissionsDialogOpen, setIsEditPermissionsDialogOpen] = useState<boolean>(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      username: '',
      password: '',
      role: 'user',
    },
  });

  const permissionsForm = useForm<z.infer<typeof permissionsSchema>>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: {
      canManageCategories: false,
      canEditBills: false,
      canCreateBills: false,
      canViewRevenueAndPricing: false,
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newUserSchema>) => {
      return await apiRequest('POST', '/api/users', data);
    },
    onSuccess: () => {
      setIsAddUserDialogOpen(false);
      newUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Thành công',
        description: 'Người dùng mới đã được tạo',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: `Không thể tạo người dùng: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { id: number; permissions: z.infer<typeof permissionsSchema> }) => {
      return await apiRequest('PATCH', `/api/users/${data.id}/permissions`, data.permissions);
    },
    onSuccess: () => {
      setIsEditPermissionsDialogOpen(false);
      setCurrentUser(null);
      permissionsForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Thành công',
        description: 'Quyền hạn đã được cập nhật',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: `Không thể cập nhật quyền hạn: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { id: number; password: string }) => {
      return await apiRequest('PATCH', `/api/users/${data.id}/password`, { password: data.password });
    },
    onSuccess: () => {
      setIsChangePasswordDialogOpen(false);
      setCurrentUserId(null);
      passwordForm.reset();
      toast({
        title: 'Thành công',
        description: 'Mật khẩu đã được cập nhật',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: `Không thể cập nhật mật khẩu: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setUserIdToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Thành công',
        description: 'Người dùng đã được xóa',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: `Không thể xóa người dùng: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmitNewUser = (data: z.infer<typeof newUserSchema>) => {
    createUserMutation.mutate(data);
  };

  const onSubmitPermissions = (data: z.infer<typeof permissionsSchema>) => {
    if (currentUser) {
      updatePermissionsMutation.mutate({ id: currentUser.id, permissions: data });
    }
  };

  const onSubmitPassword = (data: z.infer<typeof passwordSchema>) => {
    if (currentUserId) {
      updatePasswordMutation.mutate({ id: currentUserId, password: data.password });
    }
  };

  const handleEditPermissions = (user: User) => {
    setCurrentUser(user);
    permissionsForm.reset({
      canManageCategories: user.canManageCategories,
      canEditBills: user.canEditBills,
      canCreateBills: user.canCreateBills,
      canViewRevenueAndPricing: user.canViewRevenueAndPricing,
    });
    setIsEditPermissionsDialogOpen(true);
  };

  const handleEditPassword = (userId: number) => {
    setCurrentUserId(userId);
    passwordForm.reset();
    setIsChangePasswordDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    setUserIdToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userIdToDelete) {
      deleteUserMutation.mutate(userIdToDelete);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
          <p className="text-muted-foreground">
            Quản lý tài khoản người dùng và phân quyền hệ thống
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Thêm người dùng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
              <DialogDescription>
                Tạo tài khoản người dùng mới với các quyền hạn cơ bản.
              </DialogDescription>
            </DialogHeader>

            <Form {...newUserForm}>
              <form onSubmit={newUserForm.handleSubmit(onSubmitNewUser)} className="space-y-4">
                <FormField
                  control={newUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên đăng nhập</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên đăng nhập" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phân quyền</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn phân quyền" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Admin có toàn quyền trong hệ thống. User cần được phân quyền chi tiết.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="w-full"
                  >
                    {createUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Tạo người dùng
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Quản lý tài khoản người dùng và phân quyền hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <UsersTable
              users={users || []}
              onEditPermissions={handleEditPermissions}
              onEditPassword={handleEditPassword}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditPermissionsDialogOpen} onOpenChange={setIsEditPermissionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa quyền hạn</DialogTitle>
            <DialogDescription>
              {currentUser && `Cập nhật quyền hạn cho người dùng: ${currentUser.username}`}
            </DialogDescription>
          </DialogHeader>

          <Form {...permissionsForm}>
            <form onSubmit={permissionsForm.handleSubmit(onSubmitPermissions)} className="space-y-4">
              <FormField
                control={permissionsForm.control}
                name="canManageCategories"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Quản lý danh mục
                      </FormLabel>
                      <FormDescription>
                        Có thể thêm, sửa, xóa các danh mục (khách hàng, dịch vụ, nhà cung cấp, loại chi phí)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={permissionsForm.control}
                name="canEditBills"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Sửa hóa đơn
                      </FormLabel>
                      <FormDescription>
                        Có thể sửa thông tin các hóa đơn và chi phí
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={permissionsForm.control}
                name="canCreateBills"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Tạo hóa đơn
                      </FormLabel>
                      <FormDescription>
                        Có thể tạo mới các hóa đơn và chi phí
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={permissionsForm.control}
                name="canViewRevenueAndPricing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Xem doanh thu và báo giá
                      </FormLabel>
                      <FormDescription>
                        Có thể xem thông tin về doanh thu, báo cáo và bảng giá
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updatePermissionsMutation.isPending}
                  className="w-full"
                >
                  {updatePermissionsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cập nhật quyền hạn
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt mật khẩu mới cho người dùng này
            </DialogDescription>
          </DialogHeader>

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Nhập mật khẩu mới" {...field} />
                    </FormControl>
                    <FormDescription>
                      Mật khẩu phải có ít nhất 6 ký tự
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  className="w-full"
                >
                  {updatePasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cập nhật mật khẩu
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Người dùng này sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xóa người dùng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
