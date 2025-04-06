// src/components/portfolio/PortfolioTable.tsx
import React from "react";
import StockRow from "./StockRow";
import type { StockData } from "../../types/types";

interface PortfolioTableProps {
  stocks: StockData[];
  totalValue: number;
  onRemoveStock: (id: number) => void;
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({
  stocks,
  totalValue,
  onRemoveStock,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Ticker
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Name
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Shares
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Price
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Value
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Target %
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Current %
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <StockRow
              key={stock.id}
              stock={stock}
              totalPortfolioValue={totalValue}
              onRemove={onRemoveStock}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioTable;
