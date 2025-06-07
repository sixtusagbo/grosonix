'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { PlatformFilter } from '@/lib/social';

interface PlatformSelectorProps {
  selectedPlatform: PlatformFilter;
  onPlatformChange: (platform: PlatformFilter) => void;
  connectedPlatforms: string[];
}

export function PlatformSelector({
  selectedPlatform,
  onPlatformChange,
  connectedPlatforms
}: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update button position when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const platforms = [
    {
      id: 'overview' as PlatformFilter,
      name: 'Overview',
      icon: '📊',
      color: 'text-electric-purple',
      description: 'All connected platforms',
      available: true,
    },
    {
      id: 'twitter' as PlatformFilter,
      name: 'Twitter',
      icon: '🐦',
      color: 'text-cyber-blue',
      description: 'Twitter analytics',
      available: connectedPlatforms.includes('twitter'),
    },
    // Temporarily disabled - will be re-enabled in future updates
    // {
    //   id: 'instagram' as PlatformFilter,
    //   name: 'Instagram',
    //   icon: '📸',
    //   color: 'text-social-pink',
    //   description: 'Instagram analytics',
    //   available: connectedPlatforms.includes('instagram'),
    // },
    // {
    //   id: 'linkedin' as PlatformFilter,
    //   name: 'LinkedIn',
    //   icon: '💼',
    //   color: 'text-linkedin-blue',
    //   description: 'LinkedIn analytics',
    //   available: connectedPlatforms.includes('linkedin'),
    // },
  ];

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);

  const dropdownContent = isOpen && mounted && buttonRect && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="fixed bg-midnight border border-electric-purple/20 rounded-lg shadow-2xl z-[9999] backdrop-blur-sm"
        style={{
          top: buttonRect.bottom + window.scrollY + 8,
          left: buttonRect.left + window.scrollX,
          width: buttonRect.width,
        }}
      >
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => {
              if (platform.available) {
                onPlatformChange(platform.id);
                setIsOpen(false);
              }
            }}
            disabled={!platform.available}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-electric-purple/10 transition-all first:rounded-t-lg last:rounded-b-lg ${
              !platform.available ? 'opacity-50 cursor-not-allowed' : ''
            } ${selectedPlatform === platform.id ? 'bg-electric-purple/20' : ''}`}
          >
            <span className="text-xl">{platform.icon}</span>
            <div className="flex-1">
              <div className={`font-medium ${platform.color}`}>
                {platform.name}
              </div>
              <div className="text-xs text-silver">
                {platform.description}
              </div>
            </div>
            {!platform.available && platform.id !== 'overview' && (
              <span className="text-xs text-warning-orange">
                Not Connected
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-midnight border border-electric-purple/20 rounded-lg px-4 py-3 hover:border-electric-purple/40 transition-all min-w-[200px]"
      >
        <span className="text-xl">{selectedPlatformData?.icon}</span>
        <div className="flex-1 text-left">
          <div className={`font-medium ${selectedPlatformData?.color}`}>
            {selectedPlatformData?.name}
          </div>
          <div className="text-xs text-silver">
            {selectedPlatformData?.description}
          </div>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-silver transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {mounted && typeof document !== 'undefined' && dropdownContent &&
        createPortal(dropdownContent, document.body)
      }
    </div>
  );
}
