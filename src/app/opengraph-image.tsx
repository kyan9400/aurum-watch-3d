import { ImageResponse } from "next/og";

export const alt = "Aurum — Time, turned by hand. A watch configurator in real-time 3D.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const indices = Array.from({ length: 12 }, (_, h) => h);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "radial-gradient(ellipse at 72% 50%, #2a2318 0%, #0F0E0C 60%)",
          color: "#F3EEE4",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 80px", width: 640 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#D2AE6D", textTransform: "uppercase", fontFamily: "sans-serif" }}>
            Aurum Horlogerie
          </div>
          <div style={{ fontSize: 92, lineHeight: 1.0, marginTop: 24, display: "flex", flexDirection: "column" }}>
            <span>Time, turned</span>
            <span style={{ color: "#D2AE6D", fontStyle: "italic" }}>by hand.</span>
          </div>
          <div style={{ fontSize: 26, color: "#B5AC9C", marginTop: 32, fontFamily: "sans-serif", lineHeight: 1.4 }}>
            Configure the Meridian 39 in real-time 3D, then take it apart.
          </div>
        </div>
        {/* the watch */}
        <div style={{ position: "absolute", left: 800, top: 0, width: 260, height: 630, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 0, width: 130, height: 630, background: "linear-gradient(90deg,#4f2a14,#8A4B26 15%,#8A4B26 85%,#4f2a14)" }} />
          <div
            style={{
              position: "absolute",
              top: 175,
              width: 280,
              height: 280,
              borderRadius: 140,
              background: "linear-gradient(135deg,#f6dc9c,#c8973f 55%,#7a5520)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 226,
                height: 226,
                borderRadius: 113,
                background: "radial-gradient(circle at 40% 35%, #2C4479, #101a33)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {indices.map((h) => {
                const a = (h / 12) * Math.PI * 2;
                return (
                  <div
                    key={h}
                    style={{
                      position: "absolute",
                      left: 113 + Math.sin(a) * 92 - 4,
                      top: 113 - Math.cos(a) * 92 - 4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: "#F0CD84",
                    }}
                  />
                );
              })}
              <div style={{ position: "absolute", top: 70, fontSize: 18, letterSpacing: 4, color: "#E9E3D6" }}>AURUM</div>
              <div style={{ position: "absolute", left: 111, top: 48, width: 4, height: 66, background: "#F0CD84", transform: "rotate(54deg)", transformOrigin: "50% 100%" }} />
              <div style={{ position: "absolute", left: 110, top: 68, width: 6, height: 46, background: "#F0CD84", transform: "rotate(-55deg)", transformOrigin: "50% 100%" }} />
              <div style={{ position: "absolute", left: 105, top: 105, width: 16, height: 16, borderRadius: 8, background: "#F0CD84" }} />
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 36, left: 80, fontSize: 18, color: "#B5AC9C", fontFamily: "sans-serif" }}>
          Concept project — fictional brand · © 2026 Alhassan Alfarran
        </div>
      </div>
    ),
    size,
  );
}
