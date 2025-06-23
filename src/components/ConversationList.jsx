import React, { useState } from "react";
import { useChat } from "../contexts/ChatContext";
import CreateConversationModal from "./CreateConversationModal";
import { Plus, Search } from "lucide-react";

const ConversationList = () => {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    currentUser,
  } = useChat();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full mt-3 flex items-center justify-center space-x-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => selectConversation(conversation.id)}
              className={`conversation-item ${
                currentConversationId === conversation.id
                  ? "conversation-active"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {conversation.avatar ? (
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600">
                      {conversation.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">
                      {conversation.name}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTime(conversation.lastMessage.sentAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.fromUserId ===
                          currentUser?.id
                            ? "You: "
                            : ""}
                          {conversation.lastMessage.content || "📎 Attachment"}
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </p>

                    {conversation.unread > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unread > 99 ? "99+" : conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Conversation Modal */}
      {showCreateModal && (
        <CreateConversationModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default ConversationList;
