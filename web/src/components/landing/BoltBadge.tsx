"use client";

import { useRef, useEffect } from 'react';

export function BoltBadge() {
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const handleAnimationEnd = () => {
      if (imgRef.current) {
        imgRef.current.classList.add('animated');
      }
    };
    
    if (imgRef.current) {
      imgRef.current.addEventListener('animationend', handleAnimationEnd);
    }
    
    return () => {
      if (imgRef.current) {
        imgRef.current.removeEventListener('animationend', handleAnimationEnd);
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <a href="https://bolt.new/?rid=os72mi" target="_blank" rel="noopener noreferrer" 
         className="block transition-all duration-300 hover:shadow-2xl">
        <img 
          ref={imgRef}
          src="https://storage.bolt.army/white_circle_360x360.png" 
          alt="Built with Bolt.new badge" 
          className="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-lg bolt-badge bolt-badge-intro"
        />
      </a>
    </div>
  );
}