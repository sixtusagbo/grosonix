"use client";

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// Common animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 }
};

export const bounceIn: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  },
  exit: { opacity: 0, scale: 0.3 }
};

export const pulseGlow: Variants = {
  initial: { scale: 1, boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.4)" },
  animate: { 
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 0 rgba(16, 185, 129, 0.4)",
      "0 0 0 10px rgba(16, 185, 129, 0)",
      "0 0 0 0 rgba(16, 185, 129, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const shake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }
};

export const celebration: Variants = {
  initial: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.2, 1.1, 1.3, 1],
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut"
    }
  }
};

// Badge-specific animation variants
export const badgeNewVariant: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 15
    }
  }
};

export const badgeAchievementVariant: Variants = {
  initial: { scale: 0, y: -50 },
  animate: { 
    scale: [0, 1.2, 1], 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Reusable animated components
interface AnimatedContainerProps {
  children: ReactNode;
  variant?: Variants;
  className?: string;
  delay?: number;
  duration?: number;
  onClick?: () => void;
}

export function AnimatedContainer({ 
  children, 
  variant = fadeInUp, 
  className = "",
  delay = 0,
  duration = 0.5,
  onClick
}: AnimatedContainerProps) {
  return (
    <motion.div
      variants={variant}
      transition={{ duration, delay }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function BaseAnimatedButton({ 
  children, 
  className = "",
  onClick,
  disabled = false,
  variant = "default"
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "celebration" | "pulse";
}) {
  const getVariant = () => {
    switch (variant) {
      case "celebration":
        return celebration;
      case "pulse":
        return pulseGlow;
      default:
        return {
          initial: { scale: 1 },
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 }
        };
    }
  };

  return (
    <motion.button
      variants={getVariant()}
      initial="initial"
      animate="animate"
      whileHover={!disabled ? "whileHover" : undefined}
      whileTap={!disabled ? "whileTap" : undefined}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}

export function AnimatedBadge({ 
  children, 
  className = "",
  variant = "default"
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "new" | "achievement";
}) {
  const getVariant = (): Variants => {
    switch (variant) {
      case "new":
        return badgeNewVariant;
      case "achievement":
        return badgeAchievementVariant;
      default:
        return fadeInScale;
    }
  };

  return (
    <motion.div
      variants={getVariant()}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger animation for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export function StaggeredList({ 
  children, 
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ 
  children, 
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
    >
      {children}
    </motion.div>
  );
}