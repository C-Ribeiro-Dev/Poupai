import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

function PIcon({ size }: { size: number }) {
  const r = Math.round(size * 0.18);
  const fs = Math.round(size * 0.54);
  return (
    <div
      style={{
        background: "#6366f1",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: r,
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: fs,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1,
        }}
      >
        P
      </span>
    </div>
  );
}

export function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("s");
  const size = raw === "192" ? 192 : 512;
  return new ImageResponse(<PIcon size={size} />, { width: size, height: size });
}
