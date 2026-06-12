import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "./_components/dashboard-content";

export const metadata: Metadata = { title: "Dashboard" };

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; periodo?: string }>;
}) {
  const { mes, periodo } = await searchParams;
  return (
    <AppShell>
      <DashboardContent mesParam={mes} periodoParam={periodo} />
    </AppShell>
  );
}
