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

// Matching substring ko bold highlight karta hai — jaise e-commerce search-suggestions mein hota hai
function HighlightedLabel({ label, query }: { label: string; query: string }) {
  if (!query) return <>{label}</>;
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, idx)}
      <span className="font-semibold text-sky-700">{label.slice(idx, idx + query.length)}</span>
      {label.slice(idx + query.length)}
    </>
  );
}

export default function SearchableSelect({ options, value, onChange, placeholder, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // keyboard-navigation ke liye currently-highlighted item
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || '';

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

  // Jab bhi filtered-list badle (naya query type hua), activeIndex reset karo top pe
  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  // Active item ko scroll-into-view karo jab keyboard se navigate ho
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  function selectOption(option: Option) {
    onChange(option.value);
    setIsOpen(false);
    setQuery('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setQuery('');
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) selectOption(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        value={isOpen ? query : selectedLabel}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { setIsOpen(true); setQuery(''); }}
        onKeyDown={handleKeyDown}
        className="input-field w-full"
        autoComplete="off"
      />
      {isOpen && (
        <ul ref={listRef} className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">No matches found</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => selectOption(o)}
                className={`cursor-pointer px-3 py-2 text-sm ${i === activeIndex ? 'bg-sky-50' : 'hover:bg-sky-50'}`}
              >
                <HighlightedLabel label={o.label} query={query} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}