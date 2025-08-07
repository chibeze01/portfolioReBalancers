// src/components/auth/AuthScreen.tsx
import React from "react";
import AuthForm from "./AuthForm";

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onSignUp,
  isLoading,
  error,
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          AI-Powered Portfolio Balancer
        </h2>
        {/* Subtitle managed within AuthForm now */}
      </div>
      <AuthForm
        onLogin={onLogin}
        onSignUp={onSignUp}
        isLoading={isLoading}
        initialError={error}
      />
    </div>
  );
};

export default AuthScreen;
