import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: existing } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("owner_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    redirect(`/admin/${existing[0].slug}`);
  }

  return <OnboardingWizard email={user.email ?? ""} />;
}
