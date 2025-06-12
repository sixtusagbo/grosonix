module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        'emerald': {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Primary
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        'electric-orange': {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B35', // Secondary
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        'neon-cyan': {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#00F5FF', // Accent
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },

        // Neutral Colors
        'charcoal': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#1A1A1A', // Dark primary
        },
        'slate-surface': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#2D3748', // Surface
          900: '#1A202C',
        },

        // Status Colors
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#00F5FF',

        // Social Platform Colors
        'twitter': '#1DA1F2',
        'instagram': '#E4405F',
        'linkedin': '#0077B5',
        'tiktok': '#000000',

        // Legacy Support (for gradual migration)
        'electric-purple': '#8B5CF6',
        'cyber-blue': '#06B6D4',
        'neon-green': '#10B981',
        'deep-space': '#1A1A1A',
        'dark-purple': '#2D3748',
        'midnight': '#2D3748',
        'pure-white': '#FFFFFF',
        'silver': '#E2E8F0',
        'muted': '#64748B',
        'warning-orange': '#F59E0B',
        'danger-red': '#EF4444',
        'social-pink': '#EC4899',
        'linkedin-blue': '#0077B5',
      },
      backgroundImage: {
        // Modern Gradients
        'hero-gradient': 'linear-gradient(135deg, #10B981 0%, #00F5FF 100%)',
        'card-gradient': 'linear-gradient(145deg, #2D3748 0%, #1A1A1A 100%)',
        'success-gradient': 'linear-gradient(90deg, #10B981 0%, #00F5FF 100%)',
        'energy-gradient': 'linear-gradient(135deg, #FF6B35 0%, #10B981 100%)',
        'cyber-gradient': 'linear-gradient(45deg, #00F5FF 0%, #10B981 50%, #FF6B35 100%)',
        'dark-gradient': 'linear-gradient(180deg, #1A1A1A 0%, #2D3748 100%)',

        // Mesh Gradients for Modern Look
        'mesh-gradient': 'radial-gradient(at 40% 20%, #10B981 0px, transparent 50%), radial-gradient(at 80% 0%, #FF6B35 0px, transparent 50%), radial-gradient(at 0% 50%, #00F5FF 0px, transparent 50%)',
      },
      boxShadow: {
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 245, 255, 0.3)',
        'neo-brutal': '8px 8px 0px rgba(16, 185, 129, 0.8)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    }
  },
  plugins: [],
}
