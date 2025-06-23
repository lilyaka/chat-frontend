import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import { Send, Paperclip, Smile } from "lucide-react";

const MessageInput = ({ replyingTo, onSent }) => {
  const { sendMessage, sendTyping } = useChat();
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() && files.length === 0) return;

    try {
      await sendMessage(
        message.trim(),
        files.length > 0 ? files : null,
        replyingTo?.id
      );

      setMessage("");
      setFiles([]);
      handleTypingChange(false);
      onSent?.();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleTypingChange = (typing) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      sendTyping(typing);
    }

    if (typing) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(false);
      }, 3000);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    handleTypingChange(e.target.value.length > 0);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);

    // Clear the input so the same file can be selected again
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="border-t bg-white">
      {/* File preview */}
      {files.length > 0 && (
        <div className="p-3 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-white rounded p-2 border"
              >
                <span className="text-sm truncate max-w-32">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-3">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <Paperclip size={20} />
          </button>

          {/* Message input */}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
              rows={1}
              style={{
                minHeight: "40px",
                height: "auto",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 128) + "px";
              }}
            />
          </div>

          {/* Emoji button */}
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <Smile size={20} />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() && files.length === 0}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
      </form>
    </div>
  );
};

export default MessageInput;
