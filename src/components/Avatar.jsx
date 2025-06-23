import React from "react";

const Avatar = ({ src, name, size = "md", online = false }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    );
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-full overflow-hidden`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}

      <div
        className={`w-full h-full bg-gray-300 flex items-center justify-center font-semibold text-gray-600 ${
          src ? "hidden" : "flex"
        }`}
      >
        {getInitials(name)}
      </div>

      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};

export default Avatar;
