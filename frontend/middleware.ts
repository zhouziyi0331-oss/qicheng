import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

// 需要登录的路由
const PROTECTED = ["/tasks", "/my-tasks", "/ability", "/story", "/onboarding", "/company", "/profile", "/notifications", "/admin", "/reports", "/withdraw", "/journey", "/chat", "/timeline"];
// 只有学生可访问
const STUDENT_ONLY = ["/tasks", "/my-tasks", "/ability", "/onboarding", "/profile", "/story", "/reports", "/withdraw", "/journey", "/timeline"];
// 只有企业可访问
const COMPANY_ONLY = ["/company"];

interface JwtPayload {
  userId: string;
  role: "student" | "company" | "admin";
  exp: number;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 开发环境跳过认证
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // 临时：跳过所有认证（开发调试用）
  return NextResponse.next();

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("accessToken")?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = jwtDecode<JwtPayload>(token);
    // Token 过期（client-side refresh 处理，这里只做基础检查）
    if (payload.exp * 1000 < Date.now()) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }

    // 角色隔离
    if (payload.role === "company" && STUDENT_ONLY.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/company/tasks", req.url));
    }
    if (payload.role === "student" && COMPANY_ONLY.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/tasks", req.url));
    }
    // Admin 路由保护
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/tasks", req.url));
    }
  } catch {
    // token 解码失败，当作未登录处理
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tasks/:path*",
    "/my-tasks/:path*",
    "/ability/:path*",
    "/story/:path*",
    "/onboarding/:path*",
    "/company/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/admin/:path*",
    "/reports/:path*",
    "/withdraw/:path*",
    "/journey/:path*",
    "/chat/:path*",
  ],
};
