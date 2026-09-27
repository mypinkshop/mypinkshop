// src/components/SearchableSelect.jsx
// Single-select searchable dropdown — brand, product, category, subcategory ke liye
import { useState, useEffect, useRef, useMemo } from 'react';

function SearchableSelect({
  label = 'Select',
  options = [],
  value = '',
  onChange,
  placeholder = 'Search...',
  allowCustom = false,
  disabled = false,
  maxHeight = 240,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize options
  const normalized = useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'string'
        ? { value: opt, label: opt }
        : { value: opt.value, label: opt.label ?? opt.value }
    );
  }, [options]);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return normalized;
    const q = search.toLowerCase();
    return normalized.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q)
    );
  }, [normalized, search]);

  // Selected label
  const selectedLabel = useMemo(() => {
    return normalized.find((o) => o.value === value)?.label || value || '';
  }, [normalized, value]);

  // Outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleCustomAdd = () => {
    if (!search.trim()) return;
    onChange(search.trim());
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      handleSelect(filtered[0]);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full text-left border rounded-xl px-4 py-2.5 flex items-center justify-between transition
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-pink-400'}
          ${isOpen ? 'ring-2 ring-pink-500 border-transparent' : 'border-gray-200'}`}
      >
        <span className={`truncate ${selectedLabel ? 'text-gray-800' : 'text-gray-400'}`}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                No results found
              </div>
            ) : (
              filtered.slice(0, 100).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-2 text-sm transition flex items-center justify-between gap-3 ${
                    opt.value === value
                      ? 'bg-pink-50 text-pink-700 font-medium'
                      : 'text-gray-700 hover:bg-pink-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && (
                    <svg
                      className="w-4 h-4 text-pink-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}

            {/* Custom add */}
            {allowCustom &&
              search.trim() &&
              !filtered.some(
                (o) => o.label.toLowerCase() === search.trim().toLowerCase()
              ) && (
                <button
                  type="button"
                  onClick={handleCustomAdd}
                  className="w-full text-left px-4 py-2 text-sm text-pink-600 hover:bg-pink-50 border-t border-gray-100 font-medium"
                >
                  + Add "{search.trim()}"
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
