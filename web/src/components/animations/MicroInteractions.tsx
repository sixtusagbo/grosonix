"use client";

import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ThumbsUp, 
  Star, 
  Bookmark, 
  Share2, 
  Plus,
  Check,
  X,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';

// Animated Button with various interaction states
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'error' | 'pulse' | 'bounce' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  className = ""
}: AnimatedButtonProps) {
  const [isClicked, setIsClicked] = useState(false);
  const controls = useAnimation();

  const handleClick = async () => {
    if (disabled || loading) return;
    
    setIsClicked(true);
    
    // Trigger click animation
    await controls.start({
      scale: [1, 0.95, 1.05, 1],
      transition: { duration: 0.3 }
    });
    
    onClick?.();
    
    setTimeout(() => setIsClicked(false), 300);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          whileHover: { scale: 1.05, backgroundColor: '#10B981' },
          whileTap: { scale: 0.95 },
          animate: isClicked ? {
            backgroundColor: ['#10B981', '#059669', '#10B981'],
            transition: { duration: 0.5 }
          } : {}
        };
      case 'error':
        return {
          whileHover: { scale: 1.05, backgroundColor: '#EF4444' },
          whileTap: { scale: 0.95 },
          animate: isClicked ? {
            x: [-5, 5, -5, 5, 0],
            transition: { duration: 0.5 }
          } : {}
        };
      case 'pulse':
        return {
          animate: {
            scale: [1, 1.05, 1],
            transition: { duration: 2, repeat: Infinity }
          },
          whileHover: { scale: 1.1 },
          whileTap: { scale: 0.95 }
        };
      case 'bounce':
        return {
          whileHover: { 
            y: [-2, -4, -2],
            transition: { duration: 0.3, repeat: Infinity }
          },
          whileTap: { scale: 0.95 }
        };
      case 'glow':
        return {
          animate: {
            boxShadow: [
              '0 0 0 0 rgba(16, 185, 129, 0.4)',
              '0 0 0 10px rgba(16, 185, 129, 0)',
              '0 0 0 0 rgba(16, 185, 129, 0.4)'
            ],
            transition: { duration: 2, repeat: Infinity }
          },
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 }
        };
      default:
        return {
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 }
        };
    }
  };

  const variantProps = getVariantStyles();

  return (
    <motion.button
      {...variantProps}
      animate={controls}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`relative overflow-hidden ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
        </motion.div>
      )}
      
      <motion.span
        animate={{ opacity: loading ? 0 : 1 }}
        className="flex items-center gap-2"
      >
        {children}
      </motion.span>
    </motion.button>
  );
}

// Like Button with heart animation
export function LikeButton({ 
  isLiked = false, 
  onToggle, 
  count = 0 
}: { 
  isLiked?: boolean; 
  onToggle?: (liked: boolean) => void;
  count?: number;
}) {
  const [liked, setLiked] = useState(isLiked);
  const [currentCount, setCurrentCount] = useState(count);

  const handleToggle = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setCurrentCount(prev => newLiked ? prev + 1 : prev - 1);
    onToggle?.(newLiked);
  };

  return (
    <motion.button
      onClick={handleToggle}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={liked ? {
          scale: [1, 1.3, 1],
          rotate: [0, -10, 10, 0]
        } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={`w-5 h-5 ${
            liked ? 'text-red-500 fill-red-500' : 'text-gray-500'
          }`}
        />
      </motion.div>
      
      <motion.span
        key={currentCount}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-gray-600 dark:text-gray-400"
      >
        {currentCount}
      </motion.span>
    </motion.button>
  );
}

// Floating Action Button
export function FloatingActionButton({
  icon: IconComponent = Plus,
  onClick,
  className = ""
}: {
  icon?: React.ComponentType<any>;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-lg z-50 ${className}`}
      whileHover={{ 
        scale: 1.1,
        boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)"
      }}
      whileTap={{ scale: 0.9 }}
      animate={{
        y: [0, -5, 0],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      <motion.div
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <IconComponent className="w-6 h-6" />
      </motion.div>
    </motion.button>
  );
}

// Hover Card with tilt effect
export function HoverCard({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      className={`perspective-1000 ${className}`}
    >
      <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
        {children}
      </Card>
    </motion.div>
  );
}

// Progress Ring
export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  className = ""
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-emerald-500"
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// Ripple Effect Button
export function RippleButton({
  children,
  onClick,
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </button>
  );
}

// Magnetic Button (follows cursor)
export function MagneticButton({
  children,
  onClick,
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (event.clientX - centerX) * 0.15;
    const deltaY = (event.clientY - centerY) * 0.15;
    
    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`transition-all duration-200 ${className}`}
    >
      {children}
    </motion.button>
  );
}

// Success Checkmark Animation
export function SuccessCheckmark({ 
  isVisible = false,
  size = 24,
  className = ""
}: {
  isVisible?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={isVisible ? { 
        scale: [0, 1.2, 1], 
        opacity: 1,
        rotate: [0, 10, 0]
      } : { scale: 0, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <div 
        className="bg-green-500 rounded-full flex items-center justify-center text-white"
        style={{ width: size, height: size }}
      >
        <Check className="w-3/5 h-3/5" />
      </div>
    </motion.div>
  );
}
