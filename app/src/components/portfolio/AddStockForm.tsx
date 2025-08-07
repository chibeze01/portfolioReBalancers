// src/components/portfolio/AddStockForm.tsx
import React, { useState, useEffect } from "react";
import type { NewStockState } from "../../types/types";

interface AddStockFormProps {
  onAddStock: (stock: NewStockState) => void;
  onClose: () => void; // Close function for modal
  initialValues?: Partial<NewStockState>; // Add optional initialValues prop
}

const AddStockForm: React.FC<AddStockFormProps> = ({
  onAddStock,
  onClose,
  initialValues = {}, // Default to empty object
}) => {
  const [newStock, setNewStock] = useState<NewStockState>({
    ticker: initialValues.ticker || "",
    name: initialValues.name || "",
    shares: initialValues.shares || "",
    price: initialValues.price || "",
    allocation: initialValues.allocation || "",
  });

  // Update state when initialValues change
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      setNewStock((prevStock) => ({
        ...prevStock,
        ...initialValues,
      }));
    }
  }, [initialValues]);

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
    <div className="space-y-4">
      <div>
        <label
          htmlFor="ticker"
          className="block text-sm font-medium text-gray-700"
        >
          Ticker Symbol *
        </label>
        <input
          id="ticker"
          name="ticker"
          type="text"
          placeholder="e.g. AAPL"
          className="mt-1 block w-full px-3 py-2 shadow-sm sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={newStock.ticker}
          onChange={handleInputChange}
          required
        />
      </div>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Company Name (Optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Apple Inc."
          className="mt-1 block w-full px-3 py-2 shadow-sm sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={newStock.name}
          onChange={handleInputChange}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="shares"
            className="block text-sm font-medium text-gray-700"
          >
            Shares *
          </label>
          <input
            id="shares"
            name="shares"
            type="number"
            placeholder="e.g. 10"
            min="0" // Basic validation          step="any" // Allow fractional shares if needed
            className="mt-1 block w-full px-3 py-2 shadow-sm sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={newStock.shares}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
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
            className="mt-1 block w-full px-3 py-2 shadow-sm sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={newStock.price}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label
            htmlFor="allocation"
            className="block text-sm font-medium text-gray-700"
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
            className="mt-1 block w-full px-3 py-2 shadow-sm sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={newStock.allocation}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <div className="mt-6 flex flex-row sm:justify-end items-end">
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
          onClick={handleSubmit}
        >
          Add to Portfolio
        </button>
        <button
          type="button"
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          onClick={() => onClose()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddStockForm;
