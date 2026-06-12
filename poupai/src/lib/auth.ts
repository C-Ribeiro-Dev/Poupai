import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentUserId = cache(async (): Promise<string> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.id;
});
