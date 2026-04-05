import { create } from "zustand";

interface AuthState {
  userId: string | null;
  role: "student" | "company" | "admin" | null;
  nickname: string | null;
  isLoggedIn: boolean;
  login: (userId: string, role: "student" | "company" | "admin", nickname: string, tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  init: () => void;
  updateNickname: (nickname: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  role: null,
  nickname: null,
  isLoggedIn: false,

  login: (userId: string, role: "student" | "company" | "admin", nickname: string, tokens: { accessToken: string; refreshToken: string }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      localStorage.setItem("userId", userId);
      localStorage.setItem("role", role);
      localStorage.setItem("nickname", nickname);
      // 写 cookie 供 middleware 做服务端路由守卫
      document.cookie = `accessToken=${tokens.accessToken}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
    }
    set({ userId, role, nickname, isLoggedIn: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      document.cookie = "accessToken=; path=/; max-age=0";
    }
    set({ userId: null, role: null, nickname: null, isLoggedIn: false });
  },

  init: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role") as "student" | "company" | null;
    const userId = localStorage.getItem("userId");
    const nickname = localStorage.getItem("nickname");
    if (token && role && userId) {
      set({ userId, role, nickname, isLoggedIn: true });
    }
  },

  updateNickname: (nickname) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nickname", nickname);
    }
    set({ nickname });
  },
}));
