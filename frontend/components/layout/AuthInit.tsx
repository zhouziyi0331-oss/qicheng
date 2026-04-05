"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

// 页面加载时从 localStorage 恢复登录状态
export default function AuthInit() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return null;
}
