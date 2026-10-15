export const countries = [
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼', pattern: /^7\d{8}$/, maxLength: 9, example: '788 123 456' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', pattern: /^7\d{8}$/, maxLength: 9, example: '712 345 678' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬', pattern: /^7\d{8}$/, maxLength: 9, example: '712 345 678' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', pattern: /^7\d{8}$/, maxLength: 9, example: '712 345 678' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮', pattern: /^[67]\d{7}$/, maxLength: 8, example: '71 234 567' },
  { code: 'CD', name: 'DR Congo', dialCode: '+243', flag: '🇨🇩', pattern: /^[89]\d{8}$/, maxLength: 9, example: '812 345 678' },
];

export const getCountryByCode = (code) => {
  return countries.find((c) => c.code === code) || countries[0];
};

// Format a phone number for display
export const formatPhoneDisplay = (number, countryCode = 'RW') => {
  const country = getCountryByCode(countryCode);
  const cleaned = number.replace(/\D/g, '');
  
  // Format based on country
  if (countryCode === 'RW' || countryCode === 'KE' || countryCode === 'UG' || countryCode === 'TZ' || countryCode === 'CD') {
    // Format: 788 123 456
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
  }
  
  if (countryCode === 'BI') {
    // Format: 71 234 567
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)}`;
  }
  
  return cleaned;
};

// Validate a phone number for a country
export const validatePhone = (number, countryCode = 'RW') => {
  const country = getCountryByCode(countryCode);
  const cleaned = number.replace(/\D/g, '');
  
  if (cleaned.length === 0) return { valid: false, error: 'Phone number is required' };
  
  if (!country.pattern.test(cleaned)) {
    return {
      valid: false,
      error: `Invalid ${country.name} number. Expected format: ${country.example}`,
    };
  }
  
  return { valid: true, error: null };
};

// Convert to international format for backend
export const toInternationalFormat = (number, countryCode = 'RW') => {
  const country = getCountryByCode(countryCode);
  const cleaned = number.replace(/\D/g, '');
  return `${country.dialCode}${cleaned}`;
};

// Parse an international number into country + local
export const parseInternationalNumber = (internationalNumber) => {
  if (!internationalNumber) return { countryCode: 'RW', localNumber: '' };
  
  // Try to match country dial codes (longest first)
  const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
  
  for (const country of sortedCountries) {
    if (internationalNumber.startsWith(country.dialCode)) {
      return {
        countryCode: country.code,
        localNumber: internationalNumber.slice(country.dialCode.length),
      };
    }
  }
  
  return { countryCode: 'RW', localNumber: internationalNumber };
};