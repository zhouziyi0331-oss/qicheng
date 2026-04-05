import { ReactNode } from "react";

type Color = "blue" | "green" | "orange" | "purple" | "red" | "yellow" | "gray";

const colorMap: Record<Color, string> = {
  blue:   "bg-[#1f3358] text-[#58a6ff] border-[#1f4a8a]",
  green:  "bg-[#1a3a2a] text-[#3fb950] border-[#2ea043]",
  orange: "bg-[#3d2a1a] text-[#f0883e] border-[#b76429]",
  purple: "bg-[#2d1f4a] text-[#bc8cff] border-[#6e40c9]",
  red:    "bg-[#3d1a1a] text-[#f85149] border-[#da3633]",
  yellow: "bg-[#3d300a] text-[#d29922] border-[#9e6a03]",
  gray:   "bg-[#21262d] text-[#8b949e] border-[#30363d]",
};

export default function Badge({
  children, color = "gray",
}: {
  children: ReactNode; color?: Color;
}) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorMap[color]}`}>
      {children}
    </span>
  );
}
