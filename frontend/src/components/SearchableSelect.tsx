'use client';
import { useState, useRef, useEffect } from 'react';

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
};

export default function SearchableSelect({ options, value, onChange, placeholder, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected option ka label dikhana hai jab dropdown band ho
  const selectedLabel = options.find((o) => o.value === value)?.label || '';

  // Bahar click karne pe dropdown band ho jaaye
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        value={isOpen ? query : selectedLabel}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { setIsOpen(true); setQuery(''); }}
        className="input-field w-full"
        autoComplete="off"
      />
      {isOpen && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">No matches found</li>
          ) : (
            filtered.map((o) => (
              <li
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-sky-50"
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
