import { db } from './index';
import { eq } from 'drizzle-orm';
import { users, bills, costs, costPrices, prices, suppliers, costTypes, customers, services, sessions } from '../shared/schema';

async function clearDemoData() {
  try {
    console.log('Bắt đầu xóa dữ liệu demo...');
    
    // Xóa dữ liệu từ các bảng con trước
    console.log('Xóa dữ liệu chi phí...');
    await db.delete(costs);
    
    console.log('Xóa dữ liệu hóa đơn...');
    await db.delete(bills);
    
    console.log('Xóa dữ liệu giá...');
    await db.delete(prices);
    await db.delete(costPrices);
    
    console.log('Xóa dữ liệu nhà cung cấp...');
    await db.delete(suppliers);
    
    console.log('Xóa dữ liệu loại chi phí...');
    await db.delete(costTypes);
    
    console.log('Xóa dữ liệu khách hàng...');
    await db.delete(customers);
    
    console.log('Xóa dữ liệu dịch vụ...');
    await db.delete(services);
    
    // Xóa dữ liệu phiên làm việc
    console.log('Xóa dữ liệu phiên làm việc cũ...');
    await db.delete(sessions);
    
    // Xóa tất cả người dùng NGOẠI TRỪ admin có id=1
    console.log('Xóa người dùng không phải admin...');
    await db.delete(users).where(eq(users.id, 1).not);
    
    console.log('Hoàn thành xóa dữ liệu demo!');
    console.log('Chỉ còn giữ lại tài khoản admin.');
  } catch (error) {
    console.error('Lỗi khi xóa dữ liệu demo:', error);
  }
}

clearDemoData().then(() => {
  console.log('Script hoàn thành. Thoát chương trình.');
  process.exit(0);
}).catch(err => {
  console.error('Lỗi khi chạy script:', err);
  process.exit(1);
});
