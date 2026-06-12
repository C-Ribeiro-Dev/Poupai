"use server";
import { getCurrentUserId } from "@/lib/auth";
import { globalSearch, type GlobalSearchResults } from "@/services/search";

export async function globalSearchAction(query: string): Promise<GlobalSearchResults> {
  const userId = await getCurrentUserId();
  return globalSearch(userId, query);
}
