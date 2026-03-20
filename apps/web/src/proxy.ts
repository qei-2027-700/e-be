import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

// 認証不要のパス（ロケールプレフィックスを除いた部分）
const PUBLIC_PATHS = ["/", "/auth/sign-in", "/auth/sign-up", "/auth/callback", "/auth/confirm"];

function isPublicPath(pathname: string): boolean {
  // /ja/auth/sign-in → /auth/sign-in のようにロケール部分を除去
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
  return PUBLIC_PATHS.some((p) => withoutLocale === p || withoutLocale.startsWith(p + "/"));
}

export default async function proxy(request: NextRequest) {
  // 1. next-intl でロケールルーティング処理
  const intlResponse = intlMiddleware(request);

  // 2. Supabase セッションを更新（cookie の refresh）
  const { response, user } = await updateSession(request, intlResponse);

  // 3. 未認証 + 保護ルートならサインインへリダイレクト
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const locale = request.nextUrl.pathname.split("/")[1] || routing.defaultLocale;
    const signInUrl = new URL(`/${locale}/auth/sign-in`, request.url);
    signInUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
