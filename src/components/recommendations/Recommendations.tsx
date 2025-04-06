// src/components/recommendations/Recommendations.tsx
import React from "react";
import { RefreshCw, Search } from "lucide-react";
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
  const showPlaceholder =
    !hasStocks || (hasStocks && recommendations.length === 0 && !isRebalancing);
  const placeholderText = !hasStocks
    ? "Add stocks to your portfolio to get AI-powered recommendations"
    : 'Click "Rebalance Portfolio" to get AI-powered recommendations based on your current holdings';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">AI Recommendations</h2>
        <button
          className={`bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md flex items-center justify-center transition duration-150 ease-in-out ${
            isRebalancing || !hasStocks ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={onRebalance}
          disabled={isRebalancing || !hasStocks}
        >
          {isRebalancing ? (
            <>
              <RefreshCw size={18} className="mr-2 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <RefreshCw size={18} className="mr-2" /> Rebalance Portfolio
            </>
          )}
        </button>
      </div>

      {showPlaceholder ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
          <Search size={48} className="mb-4 text-gray-300" />
          <p>{placeholderText}</p>
        </div>
      ) : isRebalancing ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
          <RefreshCw size={48} className="mb-4 text-indigo-400 animate-spin" />
          <p>Generating recommendations...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <RecommendationItem
              key={index} // Consider using a more stable key if available (e.g., rec.id)
              recommendation={rec}
              onAddClick={onAddRecommendationClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
