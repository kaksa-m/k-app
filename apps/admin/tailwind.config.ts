import type { Config } from 'tailwindcss';

// Palette intentionally mirrors the KAKSAM marketing site (kaksam-index.html)
// so the admin app doesn't feel like a different product.
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        board: { DEFAULT: '#173029', deep: '#0F221D' },
        chalk: '#F5F1E4',
        paper: { DEFAULT: '#F7F2E6', line: '#E4D9C4' },
        marigold: { DEFAULT: '#E5A231', deep: '#C8841A' },
        margin: '#B84438',
        ink: { DEFAULT: '#1D2B26', soft: '#4B5B54' },
      },
      fontFamily: {
        display: ['"Big Shoulders"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
