import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import { Phone, Video, Info } from "lucide-react";

const ChatWindow = () => {
  const {
    conversations,
    currentConversationId,
    messages,
    typingUsers,
    currentUser,
  } = useChat();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  if (!currentConversation) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
            {currentConversation.avatar ? (
              <img
                src={currentConversation.avatar}
                alt={currentConversation.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {currentConversation.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{currentConversation.name}</h2>
            <p className="text-sm text-gray-500">
              {currentConversation.isGroup
                ? `${currentConversation.members?.length || 0} members`
                : "Online"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
            <Phone size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
            <Video size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          [...messages]
            .reverse()
            .map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                currentUser={currentUser}
                onReply={handleReply}
              />
            ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-blue-600 font-medium">
                Replying to {replyingTo.sender}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {replyingTo.content}
              </p>
            </div>
            <button
              onClick={cancelReply}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <MessageInput replyingTo={replyingTo} onSent={cancelReply} />
    </div>
  );
};

export default ChatWindow;
