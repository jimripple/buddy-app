import { redirect } from "next/navigation";

import { getRscSupabase } from "@/lib/supabase/rsc";

export default async function Home() {
  const supabase = await getRscSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/projects" : "/login");
}
