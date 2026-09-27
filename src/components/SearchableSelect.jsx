// src/components/SearchableSelect.jsx
// Reusable searchable dropdown — brand, product, subcategory sab ke liye
import { useState, useEffect, useRef } from 'react';

function SearchableSelect({
  label = 'Select',
  options = [],              // [{ value, label }] ya ["SKINQ", "Mamaearth"]
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

  // Normalize options — string ya object dono handle karo
  const normalized = options.map((opt) =>
    typeof opt === 'string'
      ? { value: opt, label: opt }
      : { value: opt.value, label: opt.label ?? opt.value }
  );

  // Filter by search
  const filtered = search.trim()
    ? normalized.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : normalized;

  // Selected ka label dhundho
  const selectedLabel =
    normalized.find((o) => o.value === value)?.label || value || '';

  // Close on outside click
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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
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

  // Keyboard: Enter pe first result select, Escape pe close
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

      {/* Selected value / trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full text-left border rounded-xl px-4 py-2.5 flex items-center justify-between transition
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-pink-400'}
          ${isOpen ? 'ring-2 ring-pink-500 border-transparent' : 'border-gray-200'}`}
      >
        <span className={selectedLabel ? 'text-gray-800' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
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

          {/* Options list */}
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
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-pink-50 transition
                    ${opt.value === value ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))
            )}

            {/* Custom add */}
            {allowCustom && search.trim() && !filtered.some(
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
