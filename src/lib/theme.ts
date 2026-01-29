// Captain's Log Theme Configuration

export const theme = {
  colors: {
    // Primary - Fresh aqua/teal
    primary: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
    // Accent - Warm coral for CTAs
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
  },
  // Background images
  backgrounds: {
    // Dubai Palm Jumeirah aerial - using Unsplash
    dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80',
    // Fallback gradient
    gradient: 'linear-gradient(135deg, #0e7490 0%, #164e63 50%, #134e4a 100%)',
  },
};

export type Theme = typeof theme;
