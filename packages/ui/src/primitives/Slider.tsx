import React, { useState } from 'react';
import { cn } from '../utils/cn';

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  label?: string;
  formatValue?: (value: number) => string;
  showValue?: boolean;
  disabled?: boolean;
}

export function Slider({
  min, max, step = 1, value: controlledValue, defaultValue, onChange,
  label, formatValue, showValue = true, disabled,
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? min);
  const value = controlledValue ?? internalValue;
  const percent = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : String(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setInternalValue(v);
    onChange?.(v);
  };

  return (
    <div className={cn('space-y-2', disabled && 'opacity-50 pointer-events-none')}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-[var(--dxp-text)]">{label}</span>}
          {showValue && <span className="text-sm font-bold text-[var(--dxp-brand)]">{displayValue}</span>}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--dxp-brand)]
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[var(--dxp-brand)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
          style={{
            background: `linear-gradient(to right, var(--dxp-brand) 0%, var(--dxp-brand) ${percent}%, var(--dxp-border) ${percent}%, var(--dxp-border) 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--dxp-text-muted)]">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}
