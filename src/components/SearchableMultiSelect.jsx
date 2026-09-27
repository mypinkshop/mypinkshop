// src/components/SearchableMultiSelect.jsx
// Multi-select searchable dropdown — positions, categories, subcategories ke liye
import { useState, useEffect, useRef, useMemo } from 'react';

function SearchableMultiSelect({
  label = 'Select',
  options = [],
  selected = [],
  onChange,
  placeholder = 'Search...',
  disabled = false,
  maxHeight = 240,
  emptyText = 'No options',
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

  // Selected labels
  const selectedLabels = useMemo(() => {
    return selected
      .map((v) => {
        const found = normalized.find((o) => o.value === v);
        return { value: v, label: found?.label || v };
      })
      .filter(Boolean);
  }, [selected, normalized]);

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

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeOne = (value) => {
    onChange(selected.filter((v) => v !== value));
  };

  const selectAll = () => {
    const allValues = filtered.map((o) => o.value);
    const merged = [...new Set([...selected, ...allValues])];
    onChange(merged);
  };

  const clearAll = () => {
    onChange([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      toggle(filtered[0].value);
    }
  };

  const triggerText = () => {
    if (selected.length === 0) return null;
    if (selected.length === 1) return selectedLabels[0]?.label || '';
    return `${selected.length} selected`;
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
        <span className={`truncate ${selected.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
          {triggerText() || placeholder}
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

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.slice(0, 5).map((item) => (
            <span
              key={item.value}
              className="inline-flex items-center gap-1 bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded-full border border-pink-100"
            >
              <span className="truncate max-w-[120px]">{item.label}</span>
              <button
                type="button"
                onClick={() => removeOne(item.value)}
                className="hover:text-pink-800 shrink-0"
                aria-label="Remove"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {selected.length > 5 && (
            <span className="text-xs text-gray-400 self-center">
              +{selected.length - 5} more
            </span>
          )}
        </div>
      )}

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

          {/* Actions */}
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11px]">
            <button
              type="button"
              onClick={selectAll}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Clear
            </button>
            <span className="ml-auto text-gray-400">
              {selected.length} selected
            </span>
          </div>

          {/* Options */}
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                {search.trim() ? 'No results found' : emptyText}
              </div>
            ) : (
              filtered.slice(0, 100).map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-3 ${
                      checked ? 'bg-pink-50 text-pink-700' : 'text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${
                        checked
                          ? 'bg-pink-500 border-pink-500'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {checked && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span className={`truncate ${checked ? 'font-medium' : ''}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableMultiSelect;
