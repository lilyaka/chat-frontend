// src/components/CreateConversationModal.jsx
import React, { useState, useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import apiService from "../services/apiService";
import { X, Search } from "lucide-react";

const CreateConversationModal = ({ onClose }) => {
  const { createConversation } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const users = await apiService.searchUsers(searchTerm);
        setSearchResults(users);
      } catch (error) {
        console.error("Failed to search users:", error);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.find((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const userIds = selectedUsers.map((u) => u.id);
      const needsGroupName = selectedUsers.length > 1;

      if (needsGroupName && !groupName.trim()) {
        alert("Please enter a group name");
        return;
      }

      await createConversation(userIds, needsGroupName ? groupName : null);
      onClose();
    } catch (error) {
      console.error("Failed to create conversation:", error);
      alert("Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-h-96 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Group name input (if multiple users selected) */}
          {selectedUsers.length > 1 && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Group name..."
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selected:</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {user.fullName}
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          <div className="flex-1 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => toggleUserSelection(user)}
                className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  selectedUsers.find((u) => u.id === user.id)
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedUsers.length === 0 || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateConversationModal;
