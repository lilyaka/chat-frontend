// src/services/websocketService.js
import { Client } from "@stomp/stompjs";

// Fix for Vite/browser compatibility
if (typeof global === "undefined") {
  window.global = window;
}

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        reject(new Error("No auth token found"));
        return;
      }

      // Use native WebSocket instead of SockJS for better compatibility
      const WS_URL =
        import.meta.env.VITE_WS_URL ||
        "ws://localhost:8600/chat-server/websocket";

      this.stompClient = new Client({
        brokerURL: WS_URL,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log("STOMP Debug:", str);
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.stompClient.onConnect = (frame) => {
        console.log("Connected:", frame);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.setupDefaultSubscriptions();
        resolve();
      };

      this.stompClient.onStompError = (frame) => {
        console.error("Broker reported error:", frame.headers["message"]);
        console.error("Additional details:", frame.body);
        reject(new Error(frame.headers["message"]));
      };

      this.stompClient.onDisconnect = () => {
        console.log("Disconnected");
        this.connected = false;
        this.handleDisconnection();
      };

      this.stompClient.activate();
    });
  }

  setupDefaultSubscriptions() {
    // Private channel for conversation updates
    this.subscribe("/user/channel/private", (message) => {
      this.handlePrivateChannelMessage(JSON.parse(message.body));
    });

    // Message status updates
    this.subscribe("/user/chat/status", (message) => {
      this.handleStatusUpdate(JSON.parse(message.body));
    });

    // Presence updates
    this.subscribe("/channel/presence", (message) => {
      this.handlePresenceUpdate(JSON.parse(message.body));
    });
  }

  subscribe(destination, callback) {
    if (!this.stompClient || !this.connected) {
      console.warn("Not connected, queuing subscription:", destination);
      return;
    }

    const subscription = this.stompClient.subscribe(destination, callback);
    this.subscriptions.set(destination, subscription);
    return subscription;
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  send(destination, body) {
    if (!this.stompClient || !this.connected) {
      console.error("Cannot send message, not connected");
      return;
    }

    this.stompClient.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  // Message handlers
  addMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  removeMessageHandler(type) {
    this.messageHandlers.delete(type);
  }

  handlePrivateChannelMessage(message) {
    const handler = this.messageHandlers.get("privateChannel");
    if (handler) handler(message);
  }

  handleStatusUpdate(statusUpdate) {
    const handler = this.messageHandlers.get("statusUpdate");
    if (handler) handler(statusUpdate);
  }

  handlePresenceUpdate(presenceUpdate) {
    const handler = this.messageHandlers.get("presenceUpdate");
    if (handler) handler(presenceUpdate);
  }

  // Chat specific methods
  subscribeToConversation(conversationId, isGroup = false) {
    const destination = `/chat/${isGroup ? "group" : "user"}/${conversationId}`;
    return this.subscribe(destination, (message) => {
      const handler = this.messageHandlers.get("newMessage");
      if (handler) handler(JSON.parse(message.body));
    });
  }

  subscribeToTyping(conversationId) {
    const destination = `/chat/typing/${conversationId}`;
    return this.subscribe(destination, (message) => {
      const handler = this.messageHandlers.get("typing");
      if (handler) handler(JSON.parse(message.body));
    });
  }

  subscribeToReactions(conversationId) {
    const destination = `/chat/reaction/${conversationId}`;
    return this.subscribe(destination, (message) => {
      const handler = this.messageHandlers.get("reaction");
      if (handler) handler(JSON.parse(message.body));
    });
  }

  subscribeToThread(threadId) {
    const destination = `/chat/thread/${threadId}`;
    return this.subscribe(destination, (message) => {
      const handler = this.messageHandlers.get("threadReply");
      if (handler) handler(JSON.parse(message.body));
    });
  }

  // Send methods
  sendMessage(conversationId, content, files = null, replyMessageId = null) {
    this.send("/app/chat/send-message", {
      conversationId,
      content,
      files,
      replyMessageId,
    });
  }

  sendTyping(conversationId, isTyping) {
    this.send("/app/chat/typing", {
      conversationId,
      isTyping,
    });
  }

  sendReaction(messageId, emoji) {
    this.send("/app/chat/reaction", {
      messageId,
      emoji,
    });
  }

  sendThreadReply(threadId, content, files = null) {
    this.send("/app/chat/thread/reply", {
      threadId,
      content,
      files,
    });
  }

  markAsDelivered(messageId, conversationId) {
    this.send("/app/chat/delivered", {
      messageId,
      conversationId,
    });
  }

  markAsRead(messageId, conversationId) {
    this.send("/app/chat/read", {
      messageId,
      conversationId,
    });
  }

  markConversationAsRead(conversationId) {
    this.send("/app/chat/conversation/read", {
      conversationId,
    });
  }

  sendActivity() {
    this.send("/app/chat/activity", {});
  }

  handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
      const handler = this.messageHandlers.get("connectionLost");
      if (handler) handler();
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}

export default new WebSocketService();
