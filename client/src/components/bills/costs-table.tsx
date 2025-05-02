import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import CostAttributeBadge from "./cost-attribute-badge";

interface CostsTableProps {
  costs: any[];
  totalCost: number;
}

export default function CostsTable({ costs, totalCost }: CostsTableProps) {
  return (
    <div>
      {/* Chú thích màu sắc */}
      <div className="flex items-center justify-end space-x-2 mb-4">
        <CostAttributeBadge attributeName="Hóa đơn" />
        <CostAttributeBadge attributeName="Trả hộ" />
        <CostAttributeBadge attributeName="Ko hóa đơn" />
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
                // Lọc ra các thuộc tính được chọn (value = "true")
                const selectedAttributes = cost.attributeValues?.filter((attr: any) => 
                  attr.value === "true" && attr.attribute?.name
                ) || [];
                
                // Tạo danh sách tên thuộc tính
                const attributeLabels = selectedAttributes.map((attr: any) => attr.attribute.name);
                
                return (
                  <tr key={cost.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3">{cost.costType?.name || 'N/A'}</td>
                    <td className="py-3">{cost.supplier?.name || 'N/A'}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {attributeLabels.length > 0 ? (
                          attributeLabels.map((attrName: string, index: number) => (
                            <CostAttributeBadge 
                              key={index}
                              attributeName={attrName}
                            />
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