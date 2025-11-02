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
        <label className="text-sm font-semibold">{label}</label>
        
        <div className="flex items-center gap-2">
          {/* Decrement Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleDecrement}
            disabled={value <= min}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          {/* Value Display/Input */}
          {isEditing ? (
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              min={min}
              max={max}
              step={step}
              className="h-7 w-16 text-center px-2 text-sm"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors min-w-[4rem] justify-center"
              onClick={handleBadgeClick}
            >
              {value}{unit}
            </Badge>
          )}

          {/* Increment Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleIncrement}
            disabled={value >= max}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Slider */}
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
