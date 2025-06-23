import React, { useState, useEffect } from "react";
import { ChatProvider } from "./contexts/ChatContext";
import LoginForm from "./components/LoginForm";
import ChatApp from "./components/ChatApp";
import "./index.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <ChatProvider>
      <ChatApp onLogout={handleLogout} />
    </ChatProvider>
  );
}

export default App;
