import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8600";
const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL || "http://10.10.10.62:5000";

class ApiService {
  constructor() {
    // Chat API instance
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Auth API instance
    this.authApi = axios.create({
      baseURL: AUTH_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for chat API
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Real Auth implementation
  async login(credentials) {
    try {
      // Call real auth service
      const response = await this.authApi.post("/auth/customer/login", {
        email: credentials.email || credentials.username, // Support both email and username
        password: credentials.password,
      });

      if (response.data) {
        // Extract token and user info from response
        const { token, user, accessToken } = response.data;
        const authToken = token || accessToken;

        if (authToken) {
          localStorage.setItem("authToken", authToken);
        }

        // Store user info
        if (user) {
          localStorage.setItem("currentUser", JSON.stringify(user));
        }

        return response.data;
      }

      throw new Error("Invalid response from auth service");
    } catch (error) {
      console.error("Auth service login failed:", error);

      // Fallback to demo auth for development
      if (error.code === "ECONNREFUSED" || error.response?.status >= 500) {
        console.warn("Auth service unavailable, using demo auth");
        return this.demoLogin(credentials);
      }

      throw new Error(error.response?.data?.message || "Login failed");
    }
  }

  // Demo login fallback
  demoLogin(credentials) {
    const demoUsers = [
      {
        email: "demo@example.com",
        password: "demo123",
        user: {
          id: "demo-user-1",
          email: "demo@example.com",
          fullName: "Demo User",
          username: "demo",
        },
      },
      {
        email: "user2@example.com",
        password: "demo123",
        user: {
          id: "demo-user-2",
          email: "user2@example.com",
          fullName: "User Two",
          username: "user2",
        },
      },
    ];

    const user = demoUsers.find(
      (u) =>
        (u.email === credentials.email || u.email === credentials.username) &&
        u.password === credentials.password
    );

    if (user) {
      const demoToken = this.createDemoToken(user.user.id, user.user.fullName);
      localStorage.setItem("authToken", demoToken);
      localStorage.setItem("currentUser", JSON.stringify(user.user));

      return {
        token: demoToken,
        user: user.user,
      };
    }

    throw new Error("Invalid demo credentials");
  }

  createDemoToken(userId, fullName) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: userId,
        fullName: fullName,
        tenant: "demo-tenant",
        roles: "USER",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      })
    );
    const signature = btoa("demo-signature");

    return `${header}.${payload}.${signature}`;
  }

  async getCurrentUser() {
    // Try to get from localStorage first
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.warn("Invalid stored user data");
      }
    }

    // Try to get from chat service
    try {
      const response = await this.api.get("/auth/me");
      const user = response.data;
      localStorage.setItem("currentUser", JSON.stringify(user));
      return user;
    } catch (error) {
      console.warn("Chat service getCurrentUser failed, extracting from token");

      // Extract from token as fallback
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const user = {
            id: payload.sub,
            fullName: payload.fullName || payload.name,
            username: payload.sub,
            email: payload.email || `${payload.sub}@example.com`,
          };
          localStorage.setItem("currentUser", JSON.stringify(user));
          return user;
        } catch (e) {
          console.error("Invalid token format");
        }
      }
      throw new Error("No valid user session");
    }
  }

  async logout() {
    try {
      // Try to call auth service logout if available
      await this.authApi.post("/auth/logout");
    } catch (error) {
      console.warn("Auth service logout failed:", error.message);
    } finally {
      // Always clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
    }
  }

  // Conversation endpoints - với fallback demo data
  async getConversations() {
    try {
      const response = await this.api.get("/conversation");
      return response.data;
    } catch (error) {
      console.warn(
        "Backend getConversations failed, returning demo data:",
        error.message
      );
      return this.getDemoConversations();
    }
  }

  getDemoConversations() {
    const currentUser = this.getCurrentUserFromStorage();
    return [
      {
        id: "demo-conv-1",
        name: currentUser?.id === "demo-user-1" ? "User Two" : "Demo User",
        isGroup: false,
        avatar: null,
        lastMessage: {
          content: "Hello! This is a demo conversation.",
          sentAt: new Date().toISOString(),
          sender: "Demo User",
          fromUserId: "demo-user-1",
        },
        unread: 0,
        members: ["demo-user-1", "demo-user-2"],
      },
      {
        id: "demo-conv-2",
        name: "Team Chat",
        isGroup: true,
        avatar: null,
        lastMessage: {
          content: "Welcome to the team!",
          sentAt: new Date(Date.now() - 120000).toISOString(),
          sender: "Admin",
          fromUserId: "admin-user",
        },
        unread: 2,
        members: ["demo-user-1", "demo-user-2", "admin-user"],
      },
    ];
  }

  getCurrentUserFromStorage() {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async createConversation(payload) {
    try {
      const response = await this.api.post(
        "/conversation/quick-create",
        payload
      );
      return response.data;
    } catch (error) {
      console.warn(
        "Backend createConversation failed, creating demo conversation:",
        error.message
      );

      const newConv = {
        id: `demo-conv-${Date.now()}`,
        name: payload.groupName || "New Chat",
        isGroup: payload.userIds.length > 1,
        avatar: null,
        lastMessage: null,
        unread: 0,
        members: payload.userIds,
      };
      return newConv;
    }
  }

  // Message endpoints
  async getMessageHistory(conversationId, page = 0, size = 20) {
    try {
      const response = await this.api.get("/history", {
        params: { conversationId, page, size, sort: "sentAt,desc" },
      });
      return response.data;
    } catch (error) {
      console.warn(
        "Backend getMessageHistory failed, returning demo data:",
        error.message
      );
      return {
        content: [
          {
            id: "demo-msg-1",
            content:
              "Welcome to the demo chat! This message is from the demo backend.",
            fromUserId: "demo-user-1",
            conversationId: conversationId,
            sentAt: new Date(Date.now() - 60000).toISOString(),
            sender: "Demo User",
            avatar: null,
            attachments: [],
            reactions: [],
          },
          {
            id: "demo-msg-2",
            content: "You can test sending messages here!",
            fromUserId: "demo-user-2",
            conversationId: conversationId,
            sentAt: new Date(Date.now() - 30000).toISOString(),
            sender: "User Two",
            avatar: null,
            attachments: [],
            reactions: [],
          },
        ],
        totalElements: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    }
  }

  async markConversationAsRead(conversationId) {
    try {
      const response = await this.api.put(
        `/conversation/${conversationId}/read`
      );
      return response.data;
    } catch (error) {
      console.warn("Backend markConversationAsRead failed:", error.message);
      return { success: true };
    }
  }

  // User search
  async searchUsers(keyword) {
    try {
      const response = await this.api.get("/search/user", {
        params: { keyword },
      });
      return response.data;
    } catch (error) {
      console.warn(
        "Backend searchUsers failed, returning demo data:",
        error.message
      );

      const demoUsers = [
        {
          id: "demo-user-1",
          fullName: "Demo User",
          email: "demo@example.com",
          username: "demo",
        },
        {
          id: "demo-user-2",
          fullName: "User Two",
          email: "user2@example.com",
          username: "user2",
        },
        {
          id: "demo-user-3",
          fullName: "Jane Smith",
          email: "jane@example.com",
          username: "jane",
        },
        {
          id: "admin-user",
          fullName: "Admin User",
          email: "admin@example.com",
          username: "admin",
        },
      ];

      return demoUsers.filter(
        (user) =>
          user.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
          user.email.toLowerCase().includes(keyword.toLowerCase()) ||
          user.username.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  }

  // Placeholder methods for other endpoints
  async createThread(parentMessageId) {
    try {
      const response = await this.api.post(`/thread/create/${parentMessageId}`);
      return response.data;
    } catch (error) {
      console.warn("Backend createThread failed:", error.message);
      return { id: `thread-${Date.now()}`, parentMessageId };
    }
  }

  async addReaction(messageId, emoji) {
    try {
      const response = await this.api.post("/reaction/add", {
        messageId,
        emoji,
      });
      return response.data;
    } catch (error) {
      console.warn("Backend addReaction failed:", error.message);
      return { success: true };
    }
  }

  async removeReaction(messageId, emoji) {
    try {
      const response = await this.api.delete("/reaction/remove", {
        data: { messageId, emoji },
      });
      return response.data;
    } catch (error) {
      console.warn("Backend removeReaction failed:", error.message);
      return { success: true };
    }
  }
}

export default new ApiService();
