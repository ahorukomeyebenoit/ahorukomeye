import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { countries, getCountryByCode, formatPhoneDisplay, validatePhone } from '../utils/countries';

const PhoneInput = ({
  value = '',
  countryCode = 'RW',
  onChange,
  onCountryChange,
  placeholder,
  disabled = false,
  showError = true,
  error: externalError,
}) => {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const dropdownRef = useRef(null);

  const country = getCountryByCode(countryCode);
  const validation = validatePhone(value, countryCode);
  const showValidationError = (touched || externalError) && !validation.valid && value.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const maxLen = country.maxLength;
    const trimmed = raw.slice(0, maxLen);
    onChange(trimmed);
  };

  const handleCountrySelect = (newCountry) => {
    setOpen(false);
    onCountryChange(newCountry.code);
    // Clear the number if it doesn't fit the new country
    if (value.length > newCountry.maxLength) {
      onChange('');
    }
  };

  return (
    <div className="w-full">
      {/* Wrapper — NO overflow-hidden so dropdown can escape */}
      <div className={`
        flex items-stretch bg-white border rounded-lg transition
        ${showValidationError 
          ? 'border-red-500 focus-within:border-red-500' 
          : 'border-gray-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10'
        }
      `}>
        {/* Country Dropdown Button — with rounded-l-lg */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setOpen(!open)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-3 h-full border-r border-gray-300 bg-gray-50
              rounded-l-lg hover:bg-gray-100 transition
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            `}
          >
            <span className="text-xl leading-none">{country.flag}</span>
            <span className="text-sm font-medium text-gray-700">{country.dialCode}</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu — higher z-index, stronger shadow */}
          {open && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto">
              {countries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left transition
                    hover:bg-gray-50
                    ${c.code === countryCode ? 'bg-emerald-50' : ''}
                  `}
                >
                  <span className="text-xl">{c.flag}</span>
                  <span className="flex-1 text-sm text-gray-700">{c.name}</span>
                  <span className="text-sm text-gray-500">{c.dialCode}</span>
                  {c.code === countryCode && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Input — with rounded-r-lg */}
        <input
          type="tel"
          value={formatPhoneDisplay(value, countryCode)}
          onChange={handleInputChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder || country.example}
          disabled={disabled}
          className="flex-1 px-4 py-3 outline-none bg-white text-gray-900 placeholder-gray-400 rounded-r-lg"
        />
      </div>

      {/* Validation Error */}
      {showError && showValidationError && (
        <p className="text-xs text-red-600 mt-1.5">{validation.error}</p>
      )}
    </div>
  );
};

export default PhoneInput;