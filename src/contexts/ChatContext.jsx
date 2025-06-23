import React, { createContext, useContext, useReducer, useEffect } from "react";
import apiService from "../services/apiService";
import websocketService from "../services/websocketService";

const ChatContext = createContext();

const chatReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload };

    case "SET_CURRENT_CONVERSATION":
      return { ...state, currentConversationId: action.payload };

    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [action.payload, ...state.messages],
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
        ),
      };

    case "SET_TYPING_USERS":
      return { ...state, typingUsers: action.payload };

    case "SET_ONLINE_USERS":
      return { ...state, onlineUsers: action.payload };

    case "UPDATE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id ? { ...conv, ...action.payload } : conv
        ),
      };

    case "ADD_CONVERSATION":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

const initialState = {
  conversations: [],
  currentConversationId: null,
  messages: [],
  typingUsers: [],
  onlineUsers: [],
  currentUser: null,
  loading: false,
  error: null,
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Get current user
      const user = await apiService.getCurrentUser();
      dispatch({ type: "SET_CURRENT_USER", payload: user });

      // Connect WebSocket
      await websocketService.connect();
      setupWebSocketHandlers();

      // Load conversations
      const conversations = await apiService.getConversations();
      dispatch({ type: "SET_CONVERSATIONS", payload: conversations });

      // Send activity heartbeat every 30 seconds
      setInterval(() => {
        websocketService.sendActivity();
      }, 30000);
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const setupWebSocketHandlers = () => {
    // New messages
    websocketService.addMessageHandler("newMessage", (message) => {
      dispatch({ type: "ADD_MESSAGE", payload: message });

      // Mark as delivered if not from current user
      if (message.fromUserId !== state.currentUser?.id) {
        websocketService.markAsDelivered(message.id, message.conversationId);
      }
    });

    // Typing indicators
    websocketService.addMessageHandler("typing", (typingUpdate) => {
      dispatch({ type: "SET_TYPING_USERS", payload: typingUpdate.typingUsers });
    });

    // Reactions
    websocketService.addMessageHandler("reaction", (reactionUpdate) => {
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          id: reactionUpdate.messageId,
          reactions: reactionUpdate.reactions,
        },
      });
    });

    // Private channel (conversation updates)
    websocketService.addMessageHandler("privateChannel", (message) => {
      switch (message.type) {
        case "NEW_CONVERSATION":
          dispatch({ type: "ADD_CONVERSATION", payload: message.metadata });
          break;
        case "SUBSCRIBE":
        case "UNSUBSCRIBE":
          // Reload conversations
          loadConversations();
          break;
      }
    });

    // Presence updates
    websocketService.addMessageHandler("presenceUpdate", (presenceUpdate) => {
      // Update online users or user status
      console.log("Presence update:", presenceUpdate);
    });

    // Message status updates
    websocketService.addMessageHandler("statusUpdate", (statusUpdate) => {
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          id: statusUpdate.messageId,
          status: statusUpdate.status,
          deliveryInfo: statusUpdate.deliveryInfo,
        },
      });
    });

    // Connection lost
    websocketService.addMessageHandler("connectionLost", () => {
      dispatch({
        type: "SET_ERROR",
        payload: "Connection lost. Please refresh the page.",
      });
    });
  };

  const loadConversations = async () => {
    try {
      const conversations = await apiService.getConversations();
      dispatch({ type: "SET_CONVERSATIONS", payload: conversations });
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const selectConversation = async (conversationId) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Unsubscribe from previous conversation
      if (state.currentConversationId) {
        const prevConv = state.conversations.find(
          (c) => c.id === state.currentConversationId
        );
        websocketService.unsubscribe(
          `/chat/${prevConv?.isGroup ? "group" : "user"}/${
            state.currentConversationId
          }`
        );
        websocketService.unsubscribe(
          `/chat/typing/${state.currentConversationId}`
        );
        websocketService.unsubscribe(
          `/chat/reaction/${state.currentConversationId}`
        );
      }

      // Set current conversation
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversationId });

      // Subscribe to new conversation
      const conversation = state.conversations.find(
        (c) => c.id === conversationId
      );
      websocketService.subscribeToConversation(
        conversationId,
        conversation?.isGroup
      );
      websocketService.subscribeToTyping(conversationId);
      websocketService.subscribeToReactions(conversationId);

      // Load message history
      const messageHistory = await apiService.getMessageHistory(conversationId);
      dispatch({ type: "SET_MESSAGES", payload: messageHistory.content || [] });

      // Mark conversation as read
      await apiService.markConversationAsRead(conversationId);
      websocketService.markConversationAsRead(conversationId);
    } catch (error) {
      console.error("Failed to select conversation:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const sendMessage = async (content, files = null, replyMessageId = null) => {
    if (!state.currentConversationId || !content.trim()) return;

    try {
      // Convert files to base64 if any
      let attachments = null;
      if (files && files.length > 0) {
        attachments = await Promise.all(
          Array.from(files).map((file) => convertFileToBase64(file))
        );
      }

      websocketService.sendMessage(
        state.currentConversationId,
        content,
        attachments,
        replyMessageId
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  };

  const createConversation = async (userIds, groupName = null) => {
    try {
      const payload = {
        userIds,
        groupName,
      };

      const conversation = await apiService.createConversation(payload);
      dispatch({ type: "ADD_CONVERSATION", payload: conversation });
      return conversation;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve({
          name: file.name,
          data: base64,
          size: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendTyping = (isTyping) => {
    if (state.currentConversationId) {
      websocketService.sendTyping(state.currentConversationId, isTyping);
    }
  };

  const addReaction = (messageId, emoji) => {
    websocketService.sendReaction(messageId, emoji);
  };

  const value = {
    ...state,
    selectConversation,
    sendMessage,
    createConversation,
    sendTyping,
    addReaction,
    loadConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
