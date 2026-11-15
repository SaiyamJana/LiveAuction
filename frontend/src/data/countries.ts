// Countries offered in the contact-number selector: ISO 3166-1 alpha-2 code, name, dial code.
// The backend stores the ISO code as `contact.country` and the full international number
// (for example +919876543210) as `contact.number`.
export interface Country {
  code: string
  name: string
  dial: string
}

export const COUNTRIES: readonly Country[] = [
  { code: 'AF', name: 'Afghanistan', dial: '+93' }, { code: 'AL', name: 'Albania', dial: '+355' },
  { code: 'DZ', name: 'Algeria', dial: '+213' }, { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'AU', name: 'Australia', dial: '+61' }, { code: 'AT', name: 'Austria', dial: '+43' },
  { code: 'BH', name: 'Bahrain', dial: '+973' }, { code: 'BD', name: 'Bangladesh', dial: '+880' },
  { code: 'BE', name: 'Belgium', dial: '+32' }, { code: 'BT', name: 'Bhutan', dial: '+975' },
  { code: 'BR', name: 'Brazil', dial: '+55' }, { code: 'BN', name: 'Brunei', dial: '+673' },
  { code: 'BG', name: 'Bulgaria', dial: '+359' }, { code: 'KH', name: 'Cambodia', dial: '+855' },
  { code: 'CA', name: 'Canada', dial: '+1' }, { code: 'CL', name: 'Chile', dial: '+56' },
  { code: 'CN', name: 'China', dial: '+86' }, { code: 'CO', name: 'Colombia', dial: '+57' },
  { code: 'HR', name: 'Croatia', dial: '+385' }, { code: 'CY', name: 'Cyprus', dial: '+357' },
  { code: 'CZ', name: 'Czechia', dial: '+420' }, { code: 'DK', name: 'Denmark', dial: '+45' },
  { code: 'EG', name: 'Egypt', dial: '+20' }, { code: 'EE', name: 'Estonia', dial: '+372' },
  { code: 'ET', name: 'Ethiopia', dial: '+251' }, { code: 'FI', name: 'Finland', dial: '+358' },
  { code: 'FR', name: 'France', dial: '+33' }, { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'GH', name: 'Ghana', dial: '+233' }, { code: 'GR', name: 'Greece', dial: '+30' },
  { code: 'HK', name: 'Hong Kong', dial: '+852' }, { code: 'HU', name: 'Hungary', dial: '+36' },
  { code: 'IS', name: 'Iceland', dial: '+354' }, { code: 'IN', name: 'India', dial: '+91' },
  { code: 'ID', name: 'Indonesia', dial: '+62' }, { code: 'IR', name: 'Iran', dial: '+98' },
  { code: 'IQ', name: 'Iraq', dial: '+964' }, { code: 'IE', name: 'Ireland', dial: '+353' },
  { code: 'IL', name: 'Israel', dial: '+972' }, { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'JM', name: 'Jamaica', dial: '+1876' }, { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'JO', name: 'Jordan', dial: '+962' }, { code: 'KZ', name: 'Kazakhstan', dial: '+7' },
  { code: 'KE', name: 'Kenya', dial: '+254' }, { code: 'KW', name: 'Kuwait', dial: '+965' },
  { code: 'LV', name: 'Latvia', dial: '+371' }, { code: 'LB', name: 'Lebanon', dial: '+961' },
  { code: 'LT', name: 'Lithuania', dial: '+370' }, { code: 'LU', name: 'Luxembourg', dial: '+352' },
  { code: 'MY', name: 'Malaysia', dial: '+60' }, { code: 'MV', name: 'Maldives', dial: '+960' },
  { code: 'MT', name: 'Malta', dial: '+356' }, { code: 'MU', name: 'Mauritius', dial: '+230' },
  { code: 'MX', name: 'Mexico', dial: '+52' }, { code: 'MA', name: 'Morocco', dial: '+212' },
  { code: 'MM', name: 'Myanmar', dial: '+95' }, { code: 'NP', name: 'Nepal', dial: '+977' },
  { code: 'NL', name: 'Netherlands', dial: '+31' }, { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'NG', name: 'Nigeria', dial: '+234' }, { code: 'NO', name: 'Norway', dial: '+47' },
  { code: 'OM', name: 'Oman', dial: '+968' }, { code: 'PK', name: 'Pakistan', dial: '+92' },
  { code: 'PE', name: 'Peru', dial: '+51' }, { code: 'PH', name: 'Philippines', dial: '+63' },
  { code: 'PL', name: 'Poland', dial: '+48' }, { code: 'PT', name: 'Portugal', dial: '+351' },
  { code: 'QA', name: 'Qatar', dial: '+974' }, { code: 'RO', name: 'Romania', dial: '+40' },
  { code: 'RU', name: 'Russia', dial: '+7' }, { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'SG', name: 'Singapore', dial: '+65' }, { code: 'SK', name: 'Slovakia', dial: '+421' },
  { code: 'SI', name: 'Slovenia', dial: '+386' }, { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'KR', name: 'South Korea', dial: '+82' }, { code: 'ES', name: 'Spain', dial: '+34' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94' }, { code: 'SE', name: 'Sweden', dial: '+46' },
  { code: 'CH', name: 'Switzerland', dial: '+41' }, { code: 'TW', name: 'Taiwan', dial: '+886' },
  { code: 'TZ', name: 'Tanzania', dial: '+255' }, { code: 'TH', name: 'Thailand', dial: '+66' },
  { code: 'TT', name: 'Trinidad and Tobago', dial: '+1868' }, { code: 'TR', name: 'Turkey', dial: '+90' },
  { code: 'UG', name: 'Uganda', dial: '+256' }, { code: 'UA', name: 'Ukraine', dial: '+380' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971' }, { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'US', name: 'United States', dial: '+1' }, { code: 'UZ', name: 'Uzbekistan', dial: '+998' },
  { code: 'VN', name: 'Vietnam', dial: '+84' }, { code: 'ZM', name: 'Zambia', dial: '+260' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263' },
]

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]))

export function findCountry(code: string): Country | undefined {
  return BY_CODE.get(code.toUpperCase())
}

// "IN" -> "India". Falls back to the code itself for countries that are not in the list.
export function countryName(code: string): string {
  return findCountry(code)?.name ?? code
}

// Best guess from the browser language ("en-IN" -> "IN"). Empty when unknown.
export function guessCountryCode(): string {
  const region = navigator.language.split('-')[1]?.toUpperCase() ?? ''
  return BY_CODE.has(region) ? region : ''
}
