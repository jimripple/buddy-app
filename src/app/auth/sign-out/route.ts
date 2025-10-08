import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getActionSupabase } from "@/lib/supabase/actions";

export async function POST(request: NextRequest) {
  const supabase = await getActionSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
