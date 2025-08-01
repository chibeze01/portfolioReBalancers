// src/components/layout/Header.tsx
import React from "react";

interface HeaderProps {
  userEmail: string | undefined; // User might not have email in edge cases
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, onLogout }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          AI-Powered Portfolio Balancer
        </h1>
        <div>
          {userEmail && (
            <span className="text-sm text-gray-500 mr-4">{userEmail}</span>
          )}
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
