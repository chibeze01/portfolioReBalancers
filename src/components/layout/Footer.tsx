// src/components/layout/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
      {" "}
      {/* Added mt-auto */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
        <p>
          AI-Powered Portfolio Balancer uses machine learning algorithms to
          analyze market data and research reports.
        </p>
        <p>
          Recommendations are for informational purposes only. Always conduct
          your own research before making investment decisions.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
