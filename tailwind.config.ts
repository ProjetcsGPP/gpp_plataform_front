import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        institutional: {
          blue: '#003A70', // Azul Sóbrio Principal
          light: '#F7F9FB', // Fundo das telas
          muted: '#64748B', // Texto secundário
        },
        accent: {
          urgent: '#EF4444', // Alertas críticos
          success: '#10B981', // Eficiência/Concluído
        }
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'gov': '8px',
      }
    },
  },
  plugins: [],
}
export default config
