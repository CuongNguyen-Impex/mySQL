import { formatCurrency, formatDate } from "@/lib/utils";

interface CostsTableProps {
  costs: any[];
  totalCost: number;
}

export default function CostsTable({ costs, totalCost }: CostsTableProps) {
  return (
    <div>
      {costs && costs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Loại chi phí</th>
                <th className="text-left py-3 font-medium">Nhà cung cấp</th>
                <th className="text-left py-3 font-medium">Trạng thái HĐ</th>
                <th className="text-left py-3 font-medium">Ngày</th>
                <th className="text-right py-3 font-medium">Số tiền</th>
                <th className="text-left py-3 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost: any) => {
                return (
                  <tr key={cost.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3">{cost.costType?.name || 'N/A'}</td>
                    <td className="py-3">{cost.supplier?.name || 'N/A'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cost.tt_hd === "Hóa đơn" ? "bg-green-500" : "bg-blue-500"}`}></div>
                        {cost.tt_hd || "Hóa đơn"}
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