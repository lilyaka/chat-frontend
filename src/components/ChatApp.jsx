import React from "react";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import { useChat } from "../contexts/ChatContext";
import { LogOut } from "lucide-react";

const ChatApp = ({ onLogout }) => {
  const { currentConversationId, currentUser, loading, error } = useChat();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading chat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {currentUser?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold">{currentUser?.fullName || "User"}</p>
              <p className="text-sm mt-1 text-gray-500">
                Create a new conversation or select an existing one
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1 hover:bg-gray-200 rounded"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList />
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1">
        {currentConversationId ? (
          <ChatWindow conversationId={currentConversationId} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;