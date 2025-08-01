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
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {stock.ticker}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {stock.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {stock.shares}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${stock.price.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${stockValue.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {stock.allocation}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {currentAllocation.toFixed(2)}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          className="text-red-600 hover:text-red-900"
          onClick={() => onRemove(stock.id)}
          aria-label={`Remove ${stock.ticker}`}
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

export default StockRow;
