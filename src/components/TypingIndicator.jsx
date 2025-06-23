import React from "react";

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing...`;
    } else {
      return `${users.length} people are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 text-gray-500 text-sm">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};

export default TypingIndicator;
