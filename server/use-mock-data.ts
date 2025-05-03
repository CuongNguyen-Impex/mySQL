// Helper function để xử lý khi có lỗi kết nối đến MySQL

export function useMockData<T>(
  dbQuery: () => Promise<T>,
  mockData: T,
  errorMessage = "Database connection error"
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Đặt timeout để đảm bảo không bị chờ quá lâu
    const timeoutId = setTimeout(() => {
      // Khi gặp timeout, sử dụng dữ liệu mẫu
      console.log(`Timeout waiting for database. Using mock data.`);
      resolve(mockData);
    }, 3000); // 3 giây là đủ để biết có kết nối được không

    // Gọi truy vấn database thật
    dbQuery()
      .then((result) => {
        // Nếu thành công, hủy timeout và trả về dữ liệu thật
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        // Nếu lỗi, hủy timeout và sử dụng dữ liệu mẫu
        clearTimeout(timeoutId);
        console.error(`${errorMessage}:`, error);
        resolve(mockData);
      });
  });
}
