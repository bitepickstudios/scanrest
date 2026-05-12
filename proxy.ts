import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CURRENT_RESTAURANT_COOKIE } from "@/lib/current-restaurant";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (
    user &&
    path.startsWith("/auth") &&
    path !== "/auth/select-restaurant"
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (user && path === "/admin") {
    return NextResponse.redirect(new URL("/auth/select-restaurant", request.url));
  }

  // Sync cookie with current /admin/[slug] route so server actions hit the
  // right restaurant even if user has multiple tabs open.
  if (user && path.startsWith("/admin/")) {
    const slug = path.split("/")[2];
    if (slug) {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", slug)
        .eq("owner_id", user.id)
        .single();

      if (restaurant?.id) {
        supabaseResponse.cookies.set(CURRENT_RESTAURANT_COOKIE, restaurant.id, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: COOKIE_MAX_AGE,
        });
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
