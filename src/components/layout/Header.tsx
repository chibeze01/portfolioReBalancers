// src/components/layout/Header.tsx
import React from "react";
import { LogOut } from "lucide-react";

interface HeaderProps {
  userEmail: string | undefined; // User might not have email in edge cases
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, onLogout }) => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          AI-Powered Portfolio Balancer
        </h1>
        <div className="flex items-center space-x-4">
          {userEmail && (
            <div className="text-sm text-gray-700">
              <span className="font-medium">{userEmail}</span>
            </div>
          )}
          <button
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
