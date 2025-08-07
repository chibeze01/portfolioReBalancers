// src/components/portfolio/RebalancePortfolio.tsx
import React from "react";
import { RefreshCw } from "lucide-react";
import { MaterialIcon } from "../ui";
import type { RebalanceArtifact, RebalanceItem } from "../../types/types";

interface RebalancePortfolioProps {
  onRebalance: () => void;
  isRebalancing: boolean;
  hasStocks: boolean;
  rebalanceArtifact: RebalanceArtifact | null;
  showRebalanceArtifact: boolean;
  onApplyRebalance: () => void;
}

const RebalancePortfolio: React.FC<RebalancePortfolioProps> = ({
  onRebalance,
  isRebalancing,
  hasStocks,
  rebalanceArtifact,
  showRebalanceArtifact,
  onApplyRebalance,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold leading-6 text-gray-900">
          Rebalance Portfolio
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Use our AI to generate a rebalanced version of your portfolio based on
          your goals.
        </p>
        <button
          onClick={onRebalance}
          className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isRebalancing || !hasStocks ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isRebalancing || !hasStocks}
        >
          {isRebalancing ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <MaterialIcon icon="auto_awesome" className="mr-2 -ml-1" />
              Rebalance Portfolio
            </>
          )}
        </button>
      </div>

      {/* Rebalance Artifact Result */}
      {showRebalanceArtifact && rebalanceArtifact && (
        <div className="p-6 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-800">
            Rebalanced Portfolio (Artifact)
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Generated on:{" "}
            {new Date(rebalanceArtifact.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Allocation %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rebalanceArtifact.items.map(
                  (item: RebalanceItem, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {item.ticker}
                      </td>
                      <td className="px-4 py-2 text-sm text-yellow-600">
                        {item.action}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {item.newAllocation}%
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              View Details
            </button>
            <button
              onClick={onApplyRebalance}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RebalancePortfolio;
