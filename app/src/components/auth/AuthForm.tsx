// src/components/auth/AuthForm.tsx
import React, { useState } from "react";
import { User, Mail, Lock, LogIn } from "lucide-react";

type AuthView = "login" | "signup";

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  isLoading: boolean;
  initialError: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({
  onLogin,
  onSignUp,
  isLoading,
  initialError,
}) => {
  const [authView, setAuthView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(initialError);

  const handleSubmit = async (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault(); // Prevent default form submission if used within a form
    setAuthError(null); // Clear previous errors
    if (authView === "login") {
      await onLogin(email, password);
    } else {
      await onSignUp(email, password, name);
    }
    // Note: App component will handle the error display based on the hook's result now
  };

  const toggleView = () => {
    setAuthView(authView === "login" ? "signup" : "login");
    setAuthError(null); // Clear errors when switching views
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        {authError && (
          <div className="bg-red-50 text-red-800 rounded-md p-3 mb-4 text-sm">
            {authError}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {authView === "signup" && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  authView === "login" ? "current-password" : "new-password"
                }
                required
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit" // Use submit type for form
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {authView === "login"
                    ? "Signing in..."
                    : "Creating account..."}
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  {authView === "login" ? "Sign in" : "Create account"}
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {authView === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={toggleView}
              disabled={isLoading}
            >
              {authView === "login"
                ? "Create a new account"
                : "Sign in to existing account"}
            </button>
          </div>

          {authView === "login" && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Demo credentials:</p>
              <p className="text-sm font-medium text-gray-800">
                demo@example.com / password
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
