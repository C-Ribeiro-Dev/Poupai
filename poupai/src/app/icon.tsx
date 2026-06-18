import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#6366f1",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 20,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1,
        }}
      >
        P
      </span>
    </div>,
    { width: 32, height: 32 }
  );
}
