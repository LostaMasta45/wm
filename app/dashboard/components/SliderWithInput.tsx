'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
}

export default function SliderWithInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  minLabel = 'Min',
  maxLabel = 'Max',
}: SliderWithInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) {
      numValue = value;
    } else {
      numValue = Math.max(min, Math.min(max, numValue));
    }
    onChange(numValue);
    setInputValue(numValue.toString());
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  const handleBadgeClick = () => {
    setIsEditing(true);
    setInputValue(value.toString());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        
        <div className="flex items-center gap-2">
          {/* Decrement Button */}
          <button
            onClick={handleDecrement}
            disabled={value <= min}
            className="h-8 w-8 rounded-lg border-2 border-border bg-background hover:bg-accent text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center font-bold text-lg"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Value Display/Input */}
          {isEditing ? (
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              min={min}
              max={max}
              step={step}
              className="h-8 w-20 text-center px-2 text-sm font-bold border-2 border-primary rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <button
              onClick={handleBadgeClick}
              className="h-8 px-4 min-w-[5rem] rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              {value}{unit}
            </button>
          )}

          {/* Increment Button */}
          <button
            onClick={handleIncrement}
            disabled={value >= max}
            className="h-8 w-8 rounded-lg border-2 border-border bg-background hover:bg-accent text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center font-bold text-lg"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={([val]) => onChange(val)}
          min={min}
          max={max}
          step={step}
          className="w-full slider-modern"
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs font-medium text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      
      {/* Custom Slider Styles */}
      <style jsx>{`
        :global(.slider-modern [role="slider"]) {
          background-color: #000 !important;
          border: 2px solid #000 !important;
          width: 20px !important;
          height: 20px !important;
        }
        
        :global(.dark .slider-modern [role="slider"]) {
          background-color: #fff !important;
          border: 2px solid #fff !important;
        }
        
        :global(.slider-modern [role="slider"]:hover) {
          transform: scale(1.1);
        }
        
        :global(.slider-modern [data-orientation="horizontal"]) {
          height: 6px !important;
          background-color: #e5e7eb !important;
        }
        
        :global(.dark .slider-modern [data-orientation="horizontal"]) {
          background-color: #374151 !important;
        }
      `}</style>
    </div>
  );
}
