import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Middleware para proteger rotas e gerenciar redirecionamentos de autenticação.
 * 
 * Rotas Protegidas:
 * - /dashboard: Requer autenticação
 * - /profile: Requer autenticação
 * - /orders: Requer autenticação
 * - /subscriptions: Requer autenticação
 * 
 * Rotas Públicas (redirecionam se autenticado):
 * - /login: Redireciona para /dashboard se já autenticado
 * - /register: Redireciona para /dashboard se já autenticado
 */
export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Rotas que requerem autenticação
  const protectedRoutes = ["/dashboard", "/profile", "/orders", "/subscriptions"];
  
  // Rotas de autenticação (login/register)
  const authRoutes = ["/login", "/register"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Se está tentando acessar rota protegida sem autenticação
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se está tentando acessar login/register já autenticado
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Verificar se usuário está bloqueado
  if (session?.user?.status === "BLOCKED") {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Limpar session cookie
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
