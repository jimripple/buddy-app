import { getRscSupabase } from "@/lib/supabase/rsc";

export async function getCurrentUser() {
  const supabase = await getRscSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
