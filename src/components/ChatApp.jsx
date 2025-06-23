import React, { useState } from "react";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import UserListPanel from "./UserListPanel";
import { useChat } from "../contexts/ChatContext";
import { LogOut, MessageCircle, Users, UserPlus } from "lucide-react";

const ChatApp = ({ onLogout }) => {
  const { currentConversationId, currentUser, loading, error } = useChat();
  const [activeTab, setActiveTab] = useState('conversations');

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

  const tabs = [
    {
      id: 'conversations',
      label: 'Cuộc trò chuyện',
      icon: MessageCircle,
      component: ConversationList
    },
    {
      id: 'users',
      label: 'Người dùng',
      icon: UserPlus,
      component: UserListPanel
    }
  ];

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || ConversationList;

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
              <p className="text-sm text-gray-500">
                {activeTab === 'conversations' 
                  ? 'Tạo cuộc trò chuyện mới hoặc chọn cuộc trò chuyện' 
                  : 'Tìm kiếm và chat với người dùng khác'
                }
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

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <ActiveTabComponent />
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1">
        {currentConversationId ? (
          <ChatWindow conversationId={currentConversationId} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="mb-4">
                {activeTab === 'conversations' ? (
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-300" />
                ) : (
                  <UserPlus className="w-16 h-16 mx-auto text-gray-300" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {activeTab === 'conversations' 
                  ? 'Chọn cuộc trò chuyện' 
                  : 'Bắt đầu chat mới'
                }
              </h3>
              <p className="text-gray-500">
                {activeTab === 'conversations' 
                  ? 'Chọn một cuộc trò chuyện từ danh sách để bắt đầu chat.' 
                  : 'Tìm kiếm người dùng và click để bắt đầu cuộc trò chuyện mới.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;