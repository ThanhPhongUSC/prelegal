import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Prelegal brand palette (see CLAUDE.md).
        brand: {
          accent: "#ecad0a", // yellow
          primary: "#209dd7", // blue
          secondary: "#753991", // purple (submit buttons)
          heading: "#032147", // dark navy
          body: "#888888", // gray
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
