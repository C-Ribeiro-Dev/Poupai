import type { Metadata } from "next";
import { SimuladorClient } from "./_components/simulador-client";

export const metadata: Metadata = { title: "Simulador" };

export default function SimuladorPage() {
  return <SimuladorClient />;
}
