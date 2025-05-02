import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CostsTableProps {
  costs: any[];
  totalCost: number;
}

export default function CostsTable({ costs, totalCost }: CostsTableProps) {
  return (
    <div>
      <div className="flex items-center justify-end space-x-2 mb-4">
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Hóa đơn</Badge>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Trả hộ</Badge>
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Ko hóa đơn</Badge>
      </div>
      
      {costs && costs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Loại chi phí</th>
                <th className="text-left py-3 font-medium">Nhà cung cấp</th>
                <th className="text-left py-3 font-medium">Thuộc tính</th>
                <th className="text-left py-3 font-medium">Ngày</th>
                <th className="text-right py-3 font-medium">Số tiền</th>
                <th className="text-left py-3 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost: any) => {
                // Xử lý các thuộc tính
                const selectedAttributes = cost.attributeValues?.filter((attr: any) => 
                  attr.value === "true" && attr.attribute?.name
                ) || [];
                
                // Tạo danh sách tên thuộc tính
                const attributeLabels = selectedAttributes.map((attr: any) => attr.attribute.name);
                
                // Hàm xác định màu sắc cho badge
                const getBadgeColor = (attrName: string) => {
                  switch(attrName) {
                    case "Hóa đơn": 
                      return "bg-green-100 text-green-800 border-green-300";
                    case "Trả hộ": 
                      return "bg-blue-100 text-blue-800 border-blue-300";
                    case "Ko hóa đơn": 
                      return "bg-yellow-100 text-yellow-800 border-yellow-300";
                    default: 
                      return "bg-gray-100 text-gray-800 border-gray-300";
                  }
                };
                
                return (
                  <tr key={cost.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3">{cost.costType?.name || 'N/A'}</td>
                    <td className="py-3">{cost.supplier?.name || 'N/A'}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {attributeLabels.length > 0 ? (
                          attributeLabels.map((attrName: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className={getBadgeColor(attrName)}
                            >
                              {attrName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">Không có</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">{formatDate(cost.date)}</td>
                    <td className="py-3 text-right">{formatCurrency(cost.amount)}</td>
                    <td className="py-3">{cost.notes || '-'}</td>
                  </tr>
                );
              })}
              
              {/* Tổng cộng */}
              <tr className="bg-muted/50 font-medium">
                <td colSpan={4} className="py-3">Tổng cộng</td>
                <td className="py-3 text-right">{formatCurrency(totalCost)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Không có chi phí nào được ghi nhận</p>
        </div>
      )}
    </div>
  );
}