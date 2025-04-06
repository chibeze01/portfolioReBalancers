// src/components/portfolio/AddStockForm.tsx
import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { NewStockState } from "../../types/types";

interface AddStockFormProps {
  onAddStock: (stock: NewStockState) => void;
}

const AddStockForm: React.FC<AddStockFormProps> = ({ onAddStock }) => {
  const [newStock, setNewStock] = useState<NewStockState>({
    ticker: "",
    name: "",
    shares: "",
    price: "",
    allocation: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewStock((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent potential form submission if wrapped
    // Basic validation
    if (
      newStock.ticker &&
      newStock.shares &&
      newStock.price &&
      newStock.allocation
    ) {
      onAddStock(newStock); // Pass the state object
      setNewStock({
        ticker: "",
        name: "",
        shares: "",
        price: "",
        allocation: "",
      }); // Clear form
    } else {
      // Optionally show an error message to the user
      alert(
        "Please fill in all required fields (Ticker, Shares, Price, Allocation)."
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Stock</h2>
      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ticker"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ticker Symbol *
            </label>
            <input
              id="ticker"
              name="ticker"
              type="text"
              placeholder="e.g. AAPL"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={newStock.ticker}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Apple Inc. (Optional)"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={newStock.name}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="shares"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Shares *
            </label>
            <input
              id="shares"
              name="shares"
              type="number"
              placeholder="e.g. 10"
              min="0" // Basic validation
              step="any" // Allow fractional shares if needed
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={newStock.shares}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price ($) *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              placeholder="e.g. 178.50"
              min="0"
              step="0.01" // Allow cents
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={newStock.price}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="allocation"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Allocation (%) *
            </label>
            <input
              id="allocation"
              name="allocation"
              type="number"
              placeholder="e.g. 25"
              min="0"
              max="100"
              step="1"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={newStock.allocation}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <button
          type="button" // Use button type since we handle submit manually
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center transition duration-150 ease-in-out"
          onClick={handleSubmit}
        >
          <Plus size={18} className="mr-2" /> Add to Portfolio
        </button>
      </form>
    </div>
  );
};

export default AddStockForm;
