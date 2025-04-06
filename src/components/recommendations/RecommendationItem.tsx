// src/components/recommendations/RecommendationItem.tsx
import React from "react";
import type { Recommendation } from "../../types/types";

interface RecommendationItemProps {
  recommendation: Recommendation;
  onAddClick: (ticker: string, name: string) => void; // Pass necessary info
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({
  recommendation,
  onAddClick,
}) => {
  return (
    <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition duration-150 ease-in-out">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row">
        <div className="mb-2 sm:mb-0">
          <h3 className="font-medium text-indigo-700">
            {recommendation.ticker}
          </h3>
          <p className="text-sm text-gray-600">{recommendation.name}</p>
        </div>
        <button
          className="text-sm text-blue-600 hover:text-blue-800 font-medium py-1 px-3 rounded bg-blue-100 hover:bg-blue-200 transition duration-150 ease-in-out"
          onClick={() => onAddClick(recommendation.ticker, recommendation.name)}
        >
          Add
        </button>
      </div>
      <p className="text-sm mt-2 text-gray-700">{recommendation.reason}</p>
    </div>
  );
};

export default RecommendationItem;
