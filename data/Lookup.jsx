import dedent from "dedent";

export default {
  SUGGSTIONS: [
    "Create ToDo App in React",
    "Create Budget Track App",
    "Create Gym Managment Portal Dashboard",
    "Create Quizz App On History",
    "Create Login Signup Screen",
  ],
  HERO_HEADING: "What do you want to build?",
  HERO_DESC: "Prompt, run, edit, and deploy full-stack web apps.",
  INPUT_PLACEHOLDER: "What do you want to build?",
  SIGNIN_HEADING: "Continue With SwiftCodee",
  SIGNIN_SUBHEADING:
    "To use SwiftCodee you must log into an existing account or create one.",
  SIGNIn_AGREEMENT_TEXT:
    "By using SwiftCodee, you agree to the collection of usage data for analytics.",

  DEFAULT_FILE: {
    "/public/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SwiftCodee Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
  </head>
  <body class="bg-black text-white antialiased selection:bg-[#ADFA1D] selection:text-black">
    <div id="root"></div>
  </body>
</html>`,
    },
    "/App.js": {
      code: `import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute w-96 h-96 bg-[#ADFA1D]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 max-w-md w-full bg-[#0a0a0a] border border-[#ADFA1D]/30 rounded-2xl p-8 shadow-2xl text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#ADFA1D]/10 border border-[#ADFA1D]/40 flex items-center justify-center shadow-lg shadow-[#ADFA1D]/10">
          <span className="text-[#ADFA1D] text-2xl font-extrabold font-mono">SC</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Workspace <span className="text-[#ADFA1D]">Ready</span>
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Prompt your ideas in the chat on the left to start generating your full-stack React application in real-time.
          </p>
        </div>

        {/* Interactive counter demo */}
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Live Sandbox State</span>
          <button
            onClick={() => setCount((prev) => prev + 1)}
            className="px-3.5 py-1.5 bg-[#ADFA1D] text-black font-bold text-xs rounded-lg hover:bg-[#c8ff42] transition-colors cursor-pointer"
          >
            Clicks: {count}
          </button>
        </div>
      </div>
    </div>
  );
}`,
    },
    "/styles.css": {
      code: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
    },
    "/App.css": {
      code: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
    },
    "/tailwind.config.js": {
      code: `
            /** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    },
    "/postcss.config.js": {
      code: `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
`,
    },
  },
  DEPENDANCY: {
    postcss: "^8",
    tailwindcss: "^3.4.1",
    autoprefixer: "^10.0.0",
    uuid4: "^2.0.3",
    "tailwind-merge": "^2.4.0",
    "tailwindcss-animate": "^1.0.7",
    "lucide-react": "^0.469.0",
    "react-router-dom": "^7.1.1",
    firebase: "^11.1.0",
    "@google/generative-ai": "^0.21.0",
    "date-fns": "^4.1.0",
    "react-chartjs-2": "^5.3.0",
    "chart.js": "^4.4.7",
  },
  PRICING_DESC:
    "Start with a free account to speed up your workflow on public projects or boost your entire team with instantly-opening production environments.",
  PRICING_OPTIONS: [
    {
      name: "Basic",
      tokens: "50K",
      value: 50000,
      desc: "Ideal for hobbyists and casual users for light, exploratory use.",
      price: 4.99,
    },
    {
      name: "Starter",
      tokens: "120K",
      value: 120000,
      desc: "Designed for professionals who need to use SwiftCodee a few times per week.",
      price: 9.99,
    },
    {
      name: "Pro",
      tokens: "2.5M",
      value: 2500000,
      desc: "Designed for professionals who need to use SwiftCodee a few times per week.",
      price: 19.99,
    },
    {
      name: "Unlimted (License)",
      tokens: "Unmited",
      value: 999999999,
      desc: "Designed for professionals who need to use SwiftCodee a few times per week.",
      price: 49.99,
    },
  ],
};
