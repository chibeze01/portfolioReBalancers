// src/components/portfolio/PortfolioImportExport.tsx
import React, { useRef, useState } from "react";
import { Download, Upload, Check, X } from "lucide-react";
import type { StockData } from "../../types/types";

interface PortfolioImportExportProps {
  stocks: StockData[];
  onImportData: (importedStocks: StockData[]) => void;
}

const PortfolioImportExport: React.FC<PortfolioImportExportProps> = ({
  stocks,
  onImportData,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{
    success?: string;
    error?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate CSV template for download
  const generateTemplate = () => {
    const headers = "Ticker,Company Name,Shares,Price,Target Allocation %\n";
    // Add sample data if needed
    const sampleData =
      "AAPL,Apple Inc.,10,178.72,25\n" +
      "MSFT,Microsoft Corp.,5,425.52,30\n" +
      "GOOGL,Alphabet Inc.,8,165.86,20\n";

    // Create and trigger download
    const csvContent = headers + sampleData;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export current portfolio as CSV
  const exportPortfolio = () => {
    const headers = "Ticker,Company Name,Shares,Price,Target Allocation %\n";

    // Convert current portfolio to CSV rows
    const portfolioData = stocks
      .map(
        (stock) =>
          `${stock.ticker},${stock.name},${stock.shares},${stock.price},${stock.allocation}`
      )
      .join("\n");

    // Create and trigger download
    const csvContent = headers + portfolioData;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setImportStatus({});

    // Check file type
    if (!file.name.endsWith(".csv")) {
      setImportStatus({ error: "Please upload a CSV file" });
      return;
    }

    try {
      const text = await file.text();
      const rows = text.split("\n");

      // Skip header row
      if (rows.length < 2) {
        setImportStatus({ error: "File appears to be empty or invalid" });
        return;
      }

      const importedStocks: StockData[] = [];
      let hasErrors = false;

      // Create a map of existing stocks by ticker for easy lookup
      const existingStocksMap = new Map(
        stocks.map((stock) => [stock.ticker, stock])
      );

      // Start from index 1 to skip the header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue; // Skip empty rows

        const columns = row.split(",");
        if (columns.length < 5) {
          hasErrors = true;
          continue;
        }

        const ticker = columns[0].trim().toUpperCase();
        const shares = parseFloat(columns[2]);
        const price = parseFloat(columns[3]);
        const allocation = parseFloat(columns[4]);

        if (isNaN(shares) || isNaN(price) || isNaN(allocation)) {
          hasErrors = true;
          continue;
        }

        // Check if this stock already exists in the current portfolio
        const existingStock = existingStocksMap.get(ticker);

        importedStocks.push({
          // Use existing ID if the stock already exists, otherwise generate a new one
          id: existingStock ? existingStock.id : Date.now() + i,
          ticker: ticker,
          name: columns[1].trim(),
          shares: shares,
          price: price,
          allocation: allocation,
        });

        // Remove from map to track which ones were updated
        existingStocksMap.delete(ticker);
      }

      // Add any existing stocks that weren't in the imported file
      existingStocksMap.forEach((stock) => {
        importedStocks.push(stock);
      });

      if (importedStocks.length === 0) {
        setImportStatus({ error: "No valid stock data found in the file" });
        return;
      }

      // Call the parent handler to update the portfolio
      onImportData(importedStocks);

      setImportStatus({
        success: `Successfully imported ${importedStocks.length} stocks`,
        ...(hasErrors
          ? { error: "Some rows contained errors and were skipped" }
          : {}),
      });
    } catch (error) {
      console.error("Error processing CSV file:", error);
      setImportStatus({ error: "Failed to process the file" });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Import/Export Portfolio</h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={generateTemplate}
          className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
        >
          <Download size={18} className="mr-2" /> Download Template
        </button>

        <button
          onClick={exportPortfolio}
          disabled={stocks.length === 0}
          className={`flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out ${
            stocks.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Download size={18} className="mr-2" /> Export Portfolio
        </button>
      </div>

      {/* File upload area */}
      <div
        className={`border-3 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          dragActive
            ? "border-blue-500 bg-blue-50 shadow-inner"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <Upload
          size={36}
          className={`mx-auto mb-3 transition-colors ${
            dragActive ? "text-blue-600" : "text-gray-400"
          }`}
        />

        <p className="mb-3 text-sm font-medium text-gray-700">
          Drag and drop your CSV file here, or{" "}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 font-medium underline"
            onClick={() => fileInputRef.current?.click()}
          >
            browse
          </button>
        </p>

        <p className="text-xs text-gray-500">
          Only CSV files with the correct format will be accepted
        </p>
      </div>

      {/* Status messages */}
      {importStatus.success && (
        <div className="flex items-center mt-4 p-3 text-sm rounded-md bg-green-50 text-green-800">
          <Check size={16} className="mr-2 flex-shrink-0" />
          {importStatus.success}
        </div>
      )}

      {importStatus.error && (
        <div className="flex items-center mt-4 p-3 text-sm rounded-md bg-red-50 text-red-800">
          <X size={16} className="mr-2 flex-shrink-0" />
          {importStatus.error}
        </div>
      )}
    </div>
  );
};

export default PortfolioImportExport;
