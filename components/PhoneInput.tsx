'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { countries, parsePhoneNumber, type Country } from '../lib/countries';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export default function PhoneInput({ value, onChange, error, placeholder }: PhoneInputProps) {
  const { countryCode, localNumber } = parsePhoneNumber(value);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  );

  const handleCountrySelect = (country: Country) => {
    onChange(`${country.code} ${localNumber}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanDigits = val.replace(/\D/g, '');
    onChange(`${countryCode} ${cleanDigits}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className={`flex items-center bg-gray-50 rounded-2xl border transition-all ${error ? 'border-red-300 bg-red-50' : 'border-transparent focus-within:ring-2 focus-within:ring-emerald-500/20'}`}>
        {/* Country Selector Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100/50 rounded-l-2xl border-r border-gray-200 transition-colors shrink-0"
        >
          <span className="text-lg leading-none">{selectedCountry.flag}</span>
          <span className="font-semibold text-gray-800">{selectedCountry.code}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {/* Local Phone Number Input */}
        <input
          type="tel"
          placeholder={placeholder || selectedCountry.placeholder}
          value={localNumber}
          onChange={handlePhoneChange}
          className="w-full px-4 py-3 bg-transparent text-sm outline-none border-none text-gray-800 placeholder-gray-400 rounded-r-2xl"
        />
      </div>

      {/* Country Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-[9999] overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-100 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search country..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-emerald-500/20 transition-all"
            />
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map(c => (
                <button
                  key={`${c.name}-${c.code}`}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left ${c.code === countryCode ? 'bg-emerald-50/50 font-medium' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span className="text-gray-700">{c.name}</span>
                  </div>
                  <span className="font-semibold text-gray-500">{c.code}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
