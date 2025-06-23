import React, { useState } from "react";
import { useChat } from "../contexts/ChatContext";
import { Reply, MoreHorizontal, Download } from "lucide-react";

const MessageItem = ({ message, currentUser, onReply }) => {
  const { addReaction } = useChat();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isOwnMessage = message.fromUserId === currentUser?.id;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReaction = (emoji) => {
    addReaction(message.id, emoji);
    setShowReactions(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const commonReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`max-w-xs lg:max-w-md ${
          isOwnMessage ? "order-2" : "order-1"
        }`}
      >
        {/* Sender info for other messages */}
        {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-700">
              {message.sender}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.sentAt)}
            </span>
          </div>
        )}

        {/* Reply reference */}
        {message.replyMessage && (
          <div className="mb-2 p-2 bg-gray-100 rounded border-l-4 border-blue-500">
            <p className="text-xs text-blue-600 font-medium">
              {message.replyMessage.sender}
            </p>
            <p className="text-sm text-gray-600 truncate">
              {message.replyMessage.content}
            </p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`message-bubble ${
            isOwnMessage ? "message-own" : "message-other"
          }`}
        >
          {/* Text content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-black bg-opacity-10 rounded"
                >
                  <Download size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs opacity-75">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Own message time */}
          {isOwnMessage && (
            <p className="text-xs mt-1 opacity-75">
              {formatTime(message.sentAt)}
            </p>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs"
              >
                {reaction.emoji} {reaction.count}
              </span>
            ))}
          </div>
        )}

        {/* Quick actions */}
        {showActions && (
          <div
            className={`flex items-center space-x-1 mt-1 ${
              isOwnMessage ? "justify-end" : "justify-start"
            }`}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Add reaction"
            >
              😊
            </button>
            <button
              onClick={() => onReply(message)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Reply"
            >
              <Reply size={14} />
            </button>
            <button
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="More options"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className="flex space-x-1 mt-2 p-2 bg-white rounded-lg shadow-lg border">
            {commonReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-1 hover:bg-gray-100 rounded text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
