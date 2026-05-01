import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a12",
        accent: "#7c5cff",
        accent2: "#22d3ee"
      },
      backgroundImage: {
        "radial-fade":
          "radial-gradient(1200px 600px at 20% 10%, rgba(124,92,255,0.25), transparent 60%), radial-gradient(900px 500px at 80% 30%, rgba(34,211,238,0.18), transparent 60%)"
      }
    }
  },
  plugins: []
};
export default config;
