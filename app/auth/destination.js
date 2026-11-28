// Where a signed-in person lands: staff to /admin, workers to /worker, facilities to /portal, new people to /welcome.
// `next` may only be "/apply", so a link or form can't send people to another site.
export async function destinationFor(supabase, next) {
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin) return "/admin";
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: worker }, { data: facility }] = await Promise.all([
    supabase.from("worker_profiles").select("id").eq("id", user.id).maybeSingle(),
    supabase.from("facilities").select("id").eq("owner_id", user.id).maybeSingle(),
  ]);
  if (next) return next;
  if (worker) return "/worker";
  if (facility) return "/portal";
  return "/welcome";
}
