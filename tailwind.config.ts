import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          canvas: "#ffffff",
          card: "#f8f9fa",
          elevated: "#ffffff",
          dark: "#0f172a",
        },
        punctual: {
          ontime: "#059669",
          ontimeBg: "#ecfdf5",
          ontimeBorder: "#a7f3d0",
          late: "#d97706",
          lateBg: "#fffbeb",
          lateBorder: "#fde68a",
          absent: "#e11d48",
          absentBg: "#fff1f2",
          absentBorder: "#fecdd3",
          leave: "#0284c7",
          leaveBg: "#f0f9ff",
          leaveBorder: "#bae6fd",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
