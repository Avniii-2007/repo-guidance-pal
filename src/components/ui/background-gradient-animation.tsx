import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BackgroundGradientAnimationProps {
  children: React.ReactNode;
  className?: string;
}

export function BackgroundGradientAnimation({ 
  children, 
  className 
}: BackgroundGradientAnimationProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      {/* Base modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Smooth cursor-following gradient circles */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(139, 92, 246, 0.25) 0%, 
            rgba(168, 85, 247, 0.15) 30%, 
            rgba(236, 72, 153, 0.1) 60%, 
            transparent 100%)`
        }}
      />
      
      {/* Secondary smooth gradient circle */}
      <div 
        className="absolute inset-0 transition-all duration-1200 ease-out"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(99, 102, 241, 0.15) 0%, 
            rgba(139, 92, 246, 0.1) 40%, 
            transparent 80%)`
        }}
      />
      
      {/* Gentle floating gradient circles that follow cursor */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-32 h-32 rounded-full transition-all duration-1500 ease-out"
          style={{ 
            left: `${mousePosition.x - 8}%`,
            top: `${mousePosition.y - 8}%`,
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute w-24 h-24 rounded-full transition-all duration-2000 ease-out"
          style={{ 
            left: `${mousePosition.x + 5}%`,
            top: `${mousePosition.y + 5}%`,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 60%)',
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute w-20 h-20 rounded-full transition-all duration-1800 ease-out"
          style={{ 
            left: `${mousePosition.x - 3}%`,
            top: `${mousePosition.y + 8}%`,
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 50%)',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-900/5 to-slate-900/10" />
      
      {/* Content */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
