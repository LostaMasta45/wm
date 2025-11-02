'use client';

import { useEffect, useRef } from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon?: React.ReactNode;
  onChange: (value: number) => void;
  color?: 'primary' | 'secondary' | 'accent';
}

export default function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '%',
  icon,
  onChange,
  color = 'primary',
}: SliderControlProps) {
  const sliderRef = useRef<HTMLInputElement>(null);

  // Update CSS variable for gradient
  useEffect(() => {
    if (sliderRef.current) {
      const percentage = ((value - min) / (max - min)) * 100;
      sliderRef.current.style.setProperty('--value', `${percentage}%`);
    }
  }, [value, min, max]);

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
  };

  return (
    <div className="space-y-3">
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon && <span className={colorClasses[color]}>{icon}</span>}
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className={`
            text-sm font-bold px-3 py-1 rounded-full
            bg-primary/10 text-primary border border-primary/20
          `}>
            {value}{unit}
          </span>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative pt-1">
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider w-full"
          style={{ '--value': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
        />
        
        {/* Min/Max Labels */}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">{min}{unit}</span>
          <span className="text-xs text-muted-foreground">{max}{unit}</span>
        </div>
      </div>

      {/* Value Description */}
      {value === min && (
        <p className="text-xs text-muted-foreground italic">Minimum</p>
      )}
      {value === max && (
        <p className="text-xs text-muted-foreground italic">Maximum</p>
      )}
    </div>
  );
}
