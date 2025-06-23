import React from "react";

const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  );
};

export default Loading;
