// src/hooks/useDatabase.ts
import { useState, useEffect } from "react";
import type { StockData, UseDatabaseReturn, Stock } from "../types/types";

// Custom hook to simulate database operations
export const useDatabase = (userId: string | undefined): UseDatabaseReturn => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const storageKey = userId ? `portfolio_data_${userId}` : null;

  // Load user data
  useEffect(() => {
    if (!userId || !storageKey) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true); // Set loading true when userId changes or effect runs
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        setData(JSON.parse(savedData) as StockData[]);
      } else {
        // Sample data for new users
        const sampleData: StockData[] = [
          {
            id: 1,
            ticker: "AAPL",
            name: "Apple Inc.",
            shares: 10,
            price: 178.72,
            allocation: 25,
          },
          {
            id: 2,
            ticker: "MSFT",
            name: "Microsoft Corp.",
            shares: 5,
            price: 425.52,
            allocation: 30,
          },
          {
            id: 3,
            ticker: "GOOGL",
            name: "Alphabet Inc.",
            shares: 8,
            price: 165.86,
            allocation: 20,
          },
          {
            id: 4,
            ticker: "AMZN",
            name: "Amazon.com Inc.",
            shares: 6,
            price: 182.41,
            allocation: 15,
          },
          {
            id: 5,
            ticker: "NVDA",
            name: "NVIDIA Corp.",
            shares: 2,
            price: 950.02,
            allocation: 10,
          },
        ];
        localStorage.setItem(storageKey, JSON.stringify(sampleData));
        setData(sampleData);
      }
    } catch (error) {
      console.error("Failed to load or parse data from localStorage", error);
      // Optionally clear corrupted data or provide default empty state
      localStorage.removeItem(storageKey);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [userId, storageKey]); // Re-run if userId changes

  // Insert operation
  const insert = async (
    item: Omit<Stock, "id" | "created_at"> & { created_at?: string }
  ): Promise<{ data: any; error: string | null }> => {
    if (!storageKey) return { data: null, error: "User not identified" };

    // Add ID and timestamp locally
    const newItem: StockData = {
      ...item,
      id: Date.now(), // Simple unique ID generation for mock
      created_at: item.created_at || new Date().toISOString(),
    };

    const newData = [...data, newItem];
    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
      setData(newData);
      return { data: newItem, error: null };
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
      return { data: null, error: "Failed to save stock." };
    }
  };

  // Delete operation
  const remove = async (id: number): Promise<{ error: string | null }> => {
    if (!storageKey) return { error: "User not identified" };

    const newData = data.filter((item) => item.id !== id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
      setData(newData);
      return { error: null };
    } catch (error) {
      console.error("Failed to save data to localStorage after removal", error);
      return { error: "Failed to remove stock." };
    }
  };

  return {
    data,
    loading,
    insert,
    remove,
  };
};
