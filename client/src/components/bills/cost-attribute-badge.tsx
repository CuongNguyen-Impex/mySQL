import { Badge } from "@/components/ui/badge";

interface CostAttributeBadgeProps {
  attributeName: string;
}

export default function CostAttributeBadge({ attributeName }: CostAttributeBadgeProps) {
  // Trả về màu sắc tương ứng với từng loại thuộc tính
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
    <Badge 
      variant="outline" 
      className={getBadgeColor(attributeName)}
    >
      {attributeName}
    </Badge>
  );
}