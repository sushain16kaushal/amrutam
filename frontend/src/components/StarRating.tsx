'use client';

import { useState } from 'react';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_CLASSES = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

export default function StarRating({ value, onChange, readOnly = false, size = 'md' }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value;

  return (
    <div className={`flex gap-0.5 ${SIZE_CLASSES[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(null)}
          className={`${readOnly ? '' : 'cursor-pointer'} ${
            star <= displayValue ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}