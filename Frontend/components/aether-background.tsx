'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function AetherBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Background gradient */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${
          isDark
            ? 'bg-gradient-to-br from-[#0B0E14] via-[#1a1f2e] to-[#0B0E14]'
            : 'bg-gradient-to-br from-[#F5F7FA] via-[#E8ECEF] to-[#F5F7FA]'
        }`}
      />

      {/* Animated orbs - Emerald */}
      <div
        className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(35, 134, 54, 0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(35, 134, 54, 0.15) 0%, transparent 70%)',
          animation: 'float-orb 20s ease-in-out infinite',
        }}
      />

      {/* Animated orbs - Blue */}
      <div
        className="absolute top-1/3 right-20 w-80 h-80 rounded-full blur-3xl opacity-30"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(0, 209, 255, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 209, 255, 0.12) 0%, transparent 70%)',
          animation: 'float-orb-2 25s ease-in-out infinite reverse',
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(0deg, ${
            isDark ? 'rgba(0, 209, 255, 0.1)' : 'rgba(35, 134, 54, 0.05)'
          } 1px, transparent 1px), linear-gradient(90deg, ${
            isDark ? 'rgba(0, 209, 255, 0.1)' : 'rgba(35, 134, 54, 0.05)'
          } 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Radial vignette for depth */}
      <div
        className={`absolute inset-0 opacity-50 transition-colors duration-1000 ${
          isDark
            ? 'bg-radial-gradient-dark'
            : 'bg-radial-gradient-light'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)'
            : 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.05) 100%)',
        }}
      />
    </div>
  );
}
