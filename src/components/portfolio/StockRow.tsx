// src/components/portfolio/StockRow.tsx
import React from "react";
import { Trash2 } from "lucide-react";
import type { StockData } from "../../types/types";

interface StockRowProps {
  stock: StockData;
  totalPortfolioValue: number;
  onRemove: (id: number) => void;
}

const StockRow: React.FC<StockRowProps> = ({
  stock,
  totalPortfolioValue,
  onRemove,
}) => {
  const stockValue = stock.shares * stock.price;
  // Handle division by zero if total value is 0
  const currentAllocation =
    totalPortfolioValue > 0 ? (stockValue / totalPortfolioValue) * 100 : 0;

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 font-medium">{stock.ticker}</td>
      <td className="py-3 px-4">{stock.name}</td>
      <td className="py-3 px-4 text-right">{stock.shares}</td>
      <td className="py-3 px-4 text-right">${stock.price.toFixed(2)}</td>
      <td className="py-3 px-4 text-right">${stockValue.toFixed(2)}</td>
      <td className="py-3 px-4 text-right">{stock.allocation}%</td>
      <td className="py-3 px-4 text-right">{currentAllocation.toFixed(2)}%</td>
      <td className="py-3 px-4 text-center">
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => onRemove(stock.id)}
          aria-label={`Remove ${stock.ticker}`}
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

export default StockRow;
