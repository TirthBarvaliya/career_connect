/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          indigo: "#4f46e5",
          cyan: "#06b6d4",
          purple: "#7c3aed",
          emerald: "#10b981"
        }
      },
      boxShadow: {
        soft: "0 12px 35px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 1px rgba(99, 102, 241, 0.35), 0 18px 45px rgba(79, 70, 229, 0.25)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      backgroundSize: {
        "200": "200% 200%"
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" }
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(79, 70, 229, 0.45)" },
          "70%": { boxShadow: "0 0 0 10px rgba(79, 70, 229, 0)" }
        }
      },
      animation: {
        "gradient-shift": "gradient-shift 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.5s linear infinite",
        "fade-up": "fade-up 500ms ease both",
        "pulse-glow": "pulse-glow 2s infinite"
      }
    }
  },
  plugins: []
};
