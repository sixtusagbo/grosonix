module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'electric-purple': '#8B5CF6',
        'cyber-blue': '#06B6D4',
        'neon-green': '#10B981',
        'deep-space': '#0F0F23',
        'midnight': '#1A1A2E',
        'pure-white': '#FFFFFF',
        'silver': '#E2E8F0',
        'muted': '#64748B',
        'warning-orange': '#F59E0B',
        'danger-red': '#EF4444',
        'social-pink': '#EC4899',
        'linkedin-blue': '#0077B5',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
        'card-gradient': 'linear-gradient(145deg, #1A1A2E 0%, #0F0F23 100%)',
        'success-gradient': 'linear-gradient(90deg, #10B981 0%, #06B6D4 100%)',
      }
    }
  },
  plugins: [],
}