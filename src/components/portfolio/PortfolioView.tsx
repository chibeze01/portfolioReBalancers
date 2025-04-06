// src/components/portfolio/PortfolioView.tsx
import React, { useState, useMemo } from "react";
import { BarChart3, PieChart, Search } from "lucide-react";
import PortfolioTable from "./PortfolioTable";
import PortfolioChartPlaceholder from "./PortfolioChartPlaceholder"; // Use the placeholder
import type { StockData } from "../../types/types";

type ViewMode = "table" | "chart";

interface PortfolioViewProps {
  stocks: StockData[];
  totalValue: number;
  onRemoveStock: (id: number) => void;
}

const PortfolioView: React.FC<PortfolioViewProps> = ({
  stocks,
  totalValue,
  onRemoveStock,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("table");

  const filteredStocks = useMemo(() => {
    if (!searchQuery) {
      return stocks;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return stocks.filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(lowerCaseQuery) ||
        stock.name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [stocks, searchQuery]);

  return (
    <>
      {/* Search and View Toggle */}
      <div className="flex items-center mb-6 space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search your portfolio..."
            className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        </div>

        <div className="flex space-x-2">
          <button
            title="Table View"
            aria-label="Switch to table view"
            className={`p-2 rounded-lg ${
              view === "table"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setView("table")}
          >
            <BarChart3 size={20} />
          </button>
          <button
            title="Chart View"
            aria-label="Switch to chart view"
            className={`p-2 rounded-lg ${
              view === "chart"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setView("chart")}
          >
            <PieChart size={20} />
          </button>
        </div>
      </div>

      {/* Portfolio Display Area */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Portfolio</h2>
          <div className="text-right">
            <p className="text-lg font-bold">
              $
              {totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-600">Total Value</p>
          </div>
        </div>

        {stocks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <BarChart3 size={48} /> {/* Or another appropriate icon */}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No stocks yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a stock below.
            </p>
          </div>
        ) : view === "table" ? (
          <PortfolioTable
            stocks={filteredStocks}
            totalValue={totalValue}
            onRemoveStock={onRemoveStock}
          />
        ) : (
          <PortfolioChartPlaceholder /> // Use the placeholder component
          // Later, replace with: <PortfolioChart stocks={filteredStocks} />
        )}
      </div>
    </>
  );
};

export default PortfolioView;
