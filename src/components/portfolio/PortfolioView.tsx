// src/components/portfolio/PortfolioView.tsx
import React, { useMemo } from "react";
import { BarChart3, Plus } from "lucide-react";
import PortfolioTable from "./PortfolioTable";
import type { StockData } from "../../types/types";

interface PortfolioViewProps {
  stocks: StockData[];
  totalValue: number;
  onRemoveStock: (id: number) => void;
  onAddStockClick: () => void; // New prop to handle Add New Stock button click
  onRebalance: () => void; // New prop to handle Rebalance Portfolio button click
}

const PortfolioView: React.FC<PortfolioViewProps> = ({
  stocks,
  totalValue,
  onRemoveStock,
  onAddStockClick,
  onRebalance,
}) => {
  // Calculate portfolio change
  const portfolioChange = useMemo(() => {
    // For demo purposes, let's use a static value like in the image: +15.2%
    return 15.2;
  }, []);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Current Portfolio
            </h2>
            <p className="text-sm text-gray-500">Last updated: Today</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              $
              {totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-500">Total Value</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-500 mr-2">
              Change (YTD):
            </span>
            <span className="text-sm font-semibold text-green-600">
              +{portfolioChange}%
            </span>
          </div>
          <button
            onClick={onAddStockClick}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Add New Stock"
          >
            <Plus size={18} className="mr-2 -ml-1" /> Add New Stock
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {stocks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <BarChart3 size={48} />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No stocks yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a stock using the button above.
            </p>
          </div>
        ) : (
          <PortfolioTable
            stocks={stocks}
            totalValue={totalValue}
            onRemoveStock={onRemoveStock}
          />
        )}
      </div>
    </div>
  );
};

export default PortfolioView;
