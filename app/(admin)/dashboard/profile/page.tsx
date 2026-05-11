import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/admin/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/auth/register");

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">
        Perfil del restaurante
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Esta información aparece en el storefront que ven tus clientes.
      </p>
      <div className="mt-6 max-w-2xl rounded-xl border border-neutral-200 bg-white p-6">
        <ProfileForm restaurant={restaurant} />
      </div>
    </div>
  );
}
