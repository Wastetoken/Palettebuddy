import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { Tooltip } from './Tooltip';

interface KnobProps {
  id: string;
  value: number; // Normalized 0 to 1 usually, or degrees
  min: number;
  max: number;
  fullCircle?: boolean; // If true, can rotate 360 continuously
  onChange: (newValue: number) => void;
  size?: 'sm' | 'lg';
  label?: string;
  disabled?: boolean;
  info?: string;
}

export const Knob: React.FC<KnobProps> = ({
  id,
  value,
  min,
  max,
  fullCircle = false,
  onChange,
  size = 'lg',
  label,
  disabled = false,
  info,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const startYRef = useRef(0);
  const currentRotRef = useRef(0);

  // Sync internal rotation with external value prop updates
  useEffect(() => {
    if (isDragging) return;

    // Convert value to rotation
    let newRot = 0;
    if (fullCircle) {
      newRot = value; // Assume value is degrees 0-360
    } else {
      // Map min-max to 0-280 degrees typically for non-continuous knobs
      const range = max - min;
      const percent = (value - min) / range;
      newRot = percent * 280;
    }
    
    currentRotRef.current = newRot;
    setRotation(newRot);
  }, [value, min, max, fullCircle, isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startYRef.current = e.clientY;
    document.body.style.cursor = 'grabbing';
  }, [disabled]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
  }, [disabled]);

  useEffect(() => {
    const handleMove = (clientY: number) => {
      const deltaY = startYRef.current - clientY;
      let newRot = currentRotRef.current + deltaY;
      
      startYRef.current = clientY; // Reset for relative diff

      const maxRot = fullCircle ? 360 : 280;

      if (fullCircle) {
        newRot = newRot % 360;
        if (newRot < 0) newRot += 360;
      } else {
        newRot = Math.max(0, Math.min(maxRot, newRot));
      }

      currentRotRef.current = newRot;
      setRotation(newRot);

      // Calculate output value
      let outputVal = 0;
      if (fullCircle) {
        outputVal = Math.round(newRot);
      } else {
        const percent = newRot / 280;
        outputVal = Math.round(min + percent * (max - min));
      }

      onChange(outputVal);
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging || disabled) return;
        e.preventDefault();
        handleMove(e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
        if (!isDragging || disabled) return;
        // Prevent scrolling while interacting with the knob
        if (e.cancelable) e.preventDefault();
        handleMove(e.touches[0].clientY);
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = 'none';
      }
    };

    if (isDragging) {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, fullCircle, min, max, onChange, disabled]);

  // Use GSAP for smooth visual rotation update
  useEffect(() => {
    if (knobRef.current) {
        gsap.to(knobRef.current, { 
            rotation: rotation, 
            duration: 0.1, 
            overwrite: true 
        });
    }
  }, [rotation]);

  const sizeClasses = size === 'lg' ? 'w-32 h-32 md:w-40 md:h-40' : 'w-20 h-20';

  return (
    <div className="flex flex-col items-center justify-center">
      {label && (
        <div className="flex items-center justify-center gap-1 mb-3">
            <div className="text-[0.6rem] uppercase tracking-[0.1em] font-bold text-neutral-600 shadow-white/50 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">{label}</div>
            {info && <Tooltip text={info} />}
        </div>
      )}
      
      <div className={`relative ${sizeClasses}`}>
        {/* Graduation Marks Background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
                <circle cx="0" cy="0" r="46" fill="none" className="stroke-gray-400" strokeWidth="0.5" strokeDasharray="1 3" />
            </g>
        </svg>

        {/* The Physical Knob */}
        <div
            id={id}
            ref={knobRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`
                w-full h-full rounded-full relative cursor-hover shadow-[0_10px_20px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)]
                bg-[conic-gradient(#cfcfcf,#ffffff,#cfcfcf,#999999,#cfcfcf)]
                active:cursor-grabbing touch-none
                ${disabled ? 'opacity-90 cursor-not-allowed' : 'cursor-grab'}
            `}
        >
            {/* Knob Top/Face */}
            <div className="absolute top-[5%] left-[5%] w-[90%] h-[90%] rounded-full bg-[radial-gradient(circle_at_30%_30%,#f0f0f0,#b0b0b0)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] pointer-events-none"></div>
            
            {/* Indicator Line */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-1 h-[35%] bg-neutral-800 rounded-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none"></div>
        </div>
      </div>
      
      {size === 'lg' && (
           <div className="text-[10px] w-full flex justify-between px-8 mt-2 font-mono opacity-50 select-none">
                <span>0°</span>
                <span>180°</span>
                <span>360°</span>
            </div>
      )}
    </div>
  );
};