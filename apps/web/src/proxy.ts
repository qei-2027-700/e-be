import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

// 認証不要のパス（ロケールプレフィックスを除いた部分）
const PUBLIC_PATHS = [
  "/",
  "/for-venues",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/callback",
  "/auth/confirm",
  "/events",
  "/terms",
  "/privacy",
  "/contact",
  "/api/chat",
];

function isPublicPath(pathname: string): boolean {
  // /ja/auth/sign-in → /auth/sign-in のようにロケール部分を除去
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
  return PUBLIC_PATHS.some((p) => withoutLocale === p || withoutLocale.startsWith(p + "/"));
}

export default async function proxy(request: NextRequest) {
  // API ルートは next-intl の処理をスキップ（ロケールプレフィックスが付くのを防ぐ）
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (isPublicPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }
    // 認証が必要な API ルートの場合は Supabase セッションを確認
    const { response, user } = await updateSession(request, NextResponse.next());
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
  }

  // 1. next-intl でロケールルーティング処理
  const intlResponse = intlMiddleware(request);

  // 2. パブリックパスはセッション更新不要（Supabase への不要な HTTP 呼び出しを省略）
  if (isPublicPath(request.nextUrl.pathname)) {
    return intlResponse;
  }

  // 3. Supabase セッションを更新（cookie の refresh）
  const { response, user } = await updateSession(request, intlResponse);

  // 4. 未認証なら保護ルートからサインインへリダイレクト
  if (!user) {
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
