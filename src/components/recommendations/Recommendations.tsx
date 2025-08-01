// src/components/recommendations/Recommendations.tsx
import React from "react";
import { Search, RefreshCw } from "lucide-react";
import RecommendationItem from "./RecommendationItem";
import type { Recommendation } from "../../types/types";

interface RecommendationsProps {
  recommendations: Recommendation[];
  onRebalance: () => void;
  isRebalancing: boolean;
  onAddRecommendationClick: (ticker: string, name: string) => void;
  hasStocks: boolean; // To disable rebalance if no stocks
}

const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  onRebalance,
  isRebalancing,
  onAddRecommendationClick,
  hasStocks,
}) => {
  const placeholderText = !hasStocks
    ? "Add stocks to your portfolio to get AI-powered recommendations"
    : "Analyzing your portfolio to generate recommendations...";

  return (
    <div className="bg-white rounded-lg shadow h-full">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
              AI Recommendations
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Discover new investment opportunities.
            </p>
          </div>
          {hasStocks && (
            <button
              onClick={onRebalance}
              className={`p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isRebalancing ? "animate-spin" : ""
              }`}
              title="Refresh recommendations"
              disabled={isRebalancing}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh recommendations</span>
            </button>
          )}
        </div>

        {recommendations.length > 0 ? (
          <div className="mt-4 space-y-4">
            {recommendations.map((rec, index) => (
              <RecommendationItem
                key={`${rec.ticker}-${index}`}
                recommendation={rec}
                onAddClick={onAddRecommendationClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500 mt-4">
            {isRebalancing ? (
              <div className="flex flex-col items-center">
                <RefreshCw
                  size={24}
                  className="mb-3 text-indigo-400 animate-spin"
                />
                <p className="text-sm">Generating recommendations...</p>
              </div>
            ) : (
              <>
                <Search size={24} className="mb-3 text-gray-400" />
                <p className="text-sm">{placeholderText}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
