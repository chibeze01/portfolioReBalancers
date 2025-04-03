import { useState, useEffect } from "react";
import { Search, Trash2, Plus, RefreshCw, BarChart3, PieChart } from "lucide-react";

export default function PortfolioBalancer() {
  const [portfolio, setPortfolio] = useState([
    { id: 1, ticker: "AAPL", name: "Apple Inc.", shares: 10, price: 178.72, allocation: 25 },
    { id: 2, ticker: "MSFT", name: "Microsoft Corp.", shares: 5, price: 425.52, allocation: 30 },
    { id: 3, ticker: "GOOGL", name: "Alphabet Inc.", shares: 8, price: 165.86, allocation: 20 },
    { id: 4, ticker: "AMZN", name: "Amazon.com Inc.", shares: 6, price: 182.41, allocation: 15 },
    { id: 5, ticker: "NVDA", name: "NVIDIA Corp.", shares: 2, price: 950.02, allocation: 10 },
  ]);
  
  const [newStock, setNewStock] = useState({ ticker: "", name: "", shares: "", price: "", allocation: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [view, setView] = useState("table"); // "table" or "chart"
  
  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.shares * stock.price), 0);
  
  const addStock = () => {
    if (newStock.ticker && newStock.shares && newStock.price && newStock.allocation) {
      setPortfolio([
        ...portfolio,
        {
          id: portfolio.length + 1,
          ticker: newStock.ticker.toUpperCase(),
          name: newStock.name || newStock.ticker.toUpperCase(),
          shares: parseInt(newStock.shares),
          price: parseFloat(newStock.price),
          allocation: parseInt(newStock.allocation)
        }
      ]);
      setNewStock({ ticker: "", name: "", shares: "", price: "", allocation: "" });
    }
  };
  
  const removeStock = (id) => {
    setPortfolio(portfolio.filter(stock => stock.id !== id));
  };
  
  const rebalancePortfolio = () => {
    setIsRebalancing(true);
    
    // Simulate AI-powered search and recommendation
    setTimeout(() => {
      setRecommendations([
        { ticker: "TSLA", name: "Tesla, Inc.", reason: "Strong momentum in EV market, potential growth opportunity." },
        { ticker: "VOO", name: "Vanguard S&P 500 ETF", reason: "Provides broader market exposure to balance tech-heavy portfolio." },
        { ticker: "BRK.B", name: "Berkshire Hathaway Inc.", reason: "Value stock to diversify away from tech concentration." }
      ]);
      setIsRebalancing(false);
    }, 2000);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">AI-Powered Portfolio Balancer</h1>
        <p className="text-gray-600">Optimize your investment allocation with AI-driven recommendations</p>
      </header>
      
      <div className="flex items-center mb-6 space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search your portfolio..."
            className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        </div>
        
        <div className="flex space-x-2">
          <button 
            className={`p-2 rounded-lg ${view === "table" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setView("table")}
          >
            <BarChart3 size={20} />
          </button>
          <button 
            className={`p-2 rounded-lg ${view === "chart" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setView("chart")}
          >
            <PieChart size={20} />
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Portfolio</h2>
          <div className="text-right">
            <p className="text-lg font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-600">Total Value</p>
          </div>
        </div>
        
        {view === "table" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Ticker</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-right py-3 px-4">Shares</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">Value</th>
                  <th className="text-right py-3 px-4">Target %</th>
                  <th className="text-right py-3 px-4">Current %</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio
                  .filter(stock => 
                    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(stock => {
                    const stockValue = stock.shares * stock.price;
                    const currentAllocation = (stockValue / totalValue) * 100;
                    
                    return (
                      <tr key={stock.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{stock.ticker}</td>
                        <td className="py-3 px-4">{stock.name}</td>
                        <td className="py-3 px-4 text-right">{stock.shares}</td>
                        <td className="py-3 px-4 text-right">${stock.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">${stockValue.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">{stock.allocation}%</td>
                        <td className="py-3 px-4 text-right">{currentAllocation.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-center">
                          <button 
                            className="text-red-500 hover:text-red-700" 
                            onClick={() => removeStock(stock.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <PieChart size={120} className="mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Portfolio allocation chart view</p>
              <p className="text-sm text-gray-500">Visual representation of your current allocation</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Stock</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. AAPL"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newStock.ticker}
                  onChange={(e) => setNewStock({...newStock, ticker: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apple Inc."
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newStock.name}
                  onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newStock.shares}
                  onChange={(e) => setNewStock({...newStock, shares: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 178.50"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newStock.price}
                  onChange={(e) => setNewStock({...newStock, price: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Allocation (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newStock.allocation}
                  onChange={(e) => setNewStock({...newStock, allocation: e.target.value})}
                />
              </div>
            </div>
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
              onClick={addStock}
            >
              <Plus size={18} className="mr-2" /> Add to Portfolio
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">AI Recommendations</h2>
            <button
              className={`bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md flex items-center ${isRebalancing ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={rebalancePortfolio}
              disabled={isRebalancing}
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
          
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{rec.ticker}</h3>
                      <p className="text-sm text-gray-600">{rec.name}</p>
                    </div>
                    <button className="text-sm text-blue-500 hover:text-blue-700">Add</button>
                  </div>
                  <p className="text-sm mt-2">{rec.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
              <Search size={48} className="mb-2 text-gray-300" />
              <p>Click "Rebalance Portfolio" to get AI-powered recommendations based on your current holdings</p>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-auto pt-4 text-center text-gray-500 text-sm">
        <p>AI-Powered Portfolio Balancer uses machine learning algorithms to analyze market data and research reports.</p>
        <p>Recommendations are for informational purposes only. Always conduct your own research before making investment decisions.</p>
      </footer>
    </div>
  );
}
