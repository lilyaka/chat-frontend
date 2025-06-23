import React, { useState } from "react";
import apiService from "../services/apiService";

const LoginForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await apiService.login(credentials);
      console.log("Login successful:", result);
      onLogin();
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const fillDemoCredentials = () => {
    setCredentials({
      email: "phongnv@revotech.vn",
      password: "123",
    });
  };

  const fillDemo2Credentials = () => {
    setCredentials({
      email: "demo@example.com",
      password: "demo123",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Chat
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enterprise Chat Application
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Demo Accounts
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full text-left px-3 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="font-medium text-gray-900">
                  Real Auth Service
                </div>
                <div className="text-gray-500">
                  phongnv@revotech.vn / 123
                </div>
              </button>

              <button
                type="button"
                onClick={fillDemo2Credentials}
                className="w-full text-left px-3 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="font-medium text-gray-900">Demo Fallback</div>
                <div className="text-gray-500">demo@example.com / demo123</div>
              </button>
            </div>
          </div>

          <div className="text-xs text-center text-gray-500">
            <p>The system will try real auth service first,</p>
            <p>then fallback to demo if service is unavailable.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
