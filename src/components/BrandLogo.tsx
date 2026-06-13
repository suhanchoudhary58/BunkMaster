import React from 'react';
import { Leaf } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function BrandLogo({ size = 'md', showText = true, className = '', onClick }: BrandLogoProps) {
  // Dimension definitions
  const sizes = {
    sm: { 
      box: 'w-7 h-7 rounded-lg text-sm', 
      text: 'text-base', 
      sub: 'text-[6px] tracking-[0.15em]',
      leafSize: 'w-2.5 h-2.5',
      bOffset: 'mt-[-1px]'
    },
    md: { 
      box: 'w-9 h-9 rounded-xl text-lg', 
      text: 'text-lg sm:text-xl', 
      sub: 'text-[8px] sm:text-[9px] tracking-[0.2em]',
      leafSize: 'w-3 h-3',
      bOffset: 'mt-[-1px]'
    },
    lg: { 
      box: 'w-12 h-12 rounded-2xl text-xl sm:text-2xl', 
      text: 'text-2xl', 
      sub: 'text-[10px] tracking-[0.2em]',
      leafSize: 'w-4 h-4',
      bOffset: 'mt-[-2px]'
    },
    xl: { 
      box: 'w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] sm:rounded-[24px] text-4xl sm:text-5xl', 
      text: 'text-3xl sm:text-4xl', 
      sub: 'text-xs tracking-[0.25em]',
      leafSize: 'w-6 h-6 sm:w-8 sm:h-8',
      bOffset: 'mt-[-4px]'
    }
  };

  const current = sizes[size];

  return (
    <div 
      className={`flex items-center gap-2.5 sm:gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Elegant Leaf B Logo container */}
      <div 
        className={`${current.box} relative bg-[#2E5E4E] dark:bg-[#4E7A69] text-[#FAF6F0] flex items-center justify-center font-serif font-bold shadow-md overflow-hidden shrink-0 border border-[#3E705A] dark:border-[#5E8C7A] transition-all transform hover:scale-[1.03] active:scale-[0.98] duration-200`}
        style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
      >
        {/* Subtle creamy glow/gradient */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
        
        {/* The classic serif letter "B" */}
        <span className={`relative z-10 mr-1 ${current.bOffset} font-extrabold tracking-normal`}>B</span>
        
        {/* Elegant overlay leaf stems wrapping around the base of the B */}
        <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 text-[#E3DAC9] dark:text-[#FAF6F0] z-20 transform -rotate-12 scale-90 sm:scale-100">
          <Leaf className={`${current.leafSize} fill-[#FAF6F0]/20`} strokeWidth={2.5} />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col justify-center text-left">
          <div className="flex items-center gap-1.5">
            <span 
              className="font-serif text-[#2E5E4E] dark:text-[#E2EBE5] font-extrabold tracking-wide uppercase leading-none text-md sm:text-lg" 
              style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
            >
              Bunk<span className="font-sans font-extrabold text-[#C56E4A] dark:text-[#D57E5A] tracking-normal">Master</span>
            </span>
          </div>
          <span className={`font-mono text-[#6B6B6B] dark:text-zinc-400 uppercase font-black ${current.sub} mt-1`}>
            Academic Companion
          </span>
        </div>
      )}
    </div>
  );
}
