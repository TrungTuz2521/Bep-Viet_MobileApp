/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Gam màu ấm cúng ẩm thực
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', // Cam chủ đạo
          600: '#EA580C', // Đỏ gạch / cam đậm
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        amber: {
          light: '#FEF3C7',
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        allergy: {
          light: '#FEE2E2',
          DEFAULT: '#EF4444', // Cảnh báo dị ứng cứng
          dark: '#B91C1C',
        },
        success: {
          light: '#D1FAE5',
          DEFAULT: '#10B981',
          dark: '#047857',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#121212',
          cardLight: '#F9FAFB',
          cardDark: '#1E1E1E',
          borderLight: '#E5E7EB',
          borderDark: '#2D2D2D',
        },
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
