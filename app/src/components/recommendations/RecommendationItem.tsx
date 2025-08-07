// src/components/recommendations/RecommendationItem.tsx
import React from "react";
import { Plus } from "lucide-react";
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
    <div className="p-4 rounded-md border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all duration-200 flex justify-between items-center">
      <div className="flex-grow">
        <div className="flex items-center">
          <p className="font-semibold text-gray-800">{recommendation.ticker}</p>
          <span className="mx-2 text-gray-400">•</span>
          <p className="text-sm text-gray-600 truncate">
            {recommendation.name}
          </p>
        </div>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
          {recommendation.reason}
        </p>
      </div>
      <button
        className="ml-4 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-1"
        onClick={() => onAddClick(recommendation.ticker, recommendation.name)}
        title={`Add ${recommendation.ticker} to your portfolio`}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add</span>
      </button>
    </div>
  );
};

export default RecommendationItem;
