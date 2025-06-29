// Animation utilities and base components
export * from './AnimationUtils';
// Explicitly re-export BaseAnimatedButton to avoid confusion
export { BaseAnimatedButton } from './AnimationUtils';

// Progress and counter animations
export * from './AnimatedProgress';

// Celebration and achievement modals
export * from './CelebrationModal';

// Reward notifications and badges
export * from './RewardNotifications';

// Micro-interactions and feedback (includes the main AnimatedButton)
export * from './MicroInteractions';

// Gamification dashboard widgets
export * from './GamificationWidgets';

// Gamification hook
export { useGamification } from '../../hooks/useGamification';