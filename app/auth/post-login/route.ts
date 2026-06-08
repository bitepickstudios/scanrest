import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const { data: ownedRestaurants } = await supabase
    .from("restaurants")
    .select("id, slug")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (ownedRestaurants && ownedRestaurants.length > 0) {
    if (ownedRestaurants.length === 1) {
      const r = ownedRestaurants[0];
      const { data: branches } = await supabase
        .from("branches")
        .select("slug, is_default")
        .eq("restaurant_id", r.id)
        .eq("active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (branches && branches.length > 0) {
        return NextResponse.redirect(`${origin}/admin/${r.slug}/${branches[0].slug}`);
      }
      return NextResponse.redirect(`${origin}/admin/${r.slug}`);
    }
    return NextResponse.redirect(`${origin}/auth/select-restaurant`);
  }

  const { data: staffRows } = await supabase
    .from("staff")
    .select("role, restaurant_id, branch_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(1);

  const staff = staffRows?.[0];

  if (staff) {
    const [{ data: r }, { data: b }] = await Promise.all([
      supabase
        .from("restaurants")
        .select("slug")
        .eq("id", staff.restaurant_id)
        .maybeSingle(),
      staff.branch_id
        ? supabase
            .from("branches")
            .select("slug")
            .eq("id", staff.branch_id)
            .maybeSingle()
        : Promise.resolve({ data: null as { slug: string } | null }),
    ]);

    if (r) {
      const base = staff.role === "waiter" ? "staff" : "admin";
      if (b) {
        return NextResponse.redirect(`${origin}/${base}/${r.slug}/${b.slug}`);
      }
      // No branch assigned: pick default for admin; waiters need branch.
      if (staff.role !== "waiter") {
        const { data: branches } = await supabase
          .from("branches")
          .select("slug, is_default")
          .eq("restaurant_id", staff.restaurant_id)
          .eq("active", true)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true });
        if (branches && branches.length > 0) {
          return NextResponse.redirect(`${origin}/admin/${r.slug}/${branches[0].slug}`);
        }
        return NextResponse.redirect(`${origin}/admin/${r.slug}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/onboarding`);
}
