// Development-only sample data. Replace with owner-configured values before live use.
export const salonPreviewCatalog = {
  salonId: 'elite-primary',
  isPreview: true,
  timeZone: 'local',
  hours: Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, { opensAt: '10:00', closesAt: '22:00' }])),
  services: [
    {
      id: 'signature-cut',
      name: { en: 'Signature haircut', gu: 'સિગ્નેચર હેરકટ' },
      description: { en: 'A tailored cut, finished with care.', gu: 'કાળજીપૂર્વક તૈયાર કરેલો તમારી પસંદનો કટ.' },
      priceMinorUnits: 45000,
      durationMinutes: 35,
      active: true,
    },
    {
      id: 'beard-sculpt',
      name: { en: 'Beard sculpt', gu: 'દાઢી શિલ્પ' },
      description: { en: 'A precise shape and considered finish.', gu: 'ચોક્કસ આકાર અને સુંદર ફિનિશ.' },
      priceMinorUnits: 25000,
      durationMinutes: 25,
      active: true,
    },
    {
      id: 'cut-and-beard',
      name: { en: 'Cut & beard ritual', gu: 'હેરકટ અને દાઢી સંભાળ' },
      description: { en: 'A complete, considered grooming ritual.', gu: 'સંપૂર્ણ અને વિચારપૂર્વકની ગ્રૂમિંગ સંભાળ.' },
      priceMinorUnits: 65000,
      durationMinutes: 55,
      active: true,
    },
    {
      id: 'hair-ritual',
      name: { en: 'Scalp & hair ritual', gu: 'માથા અને વાળની સંભાળ' },
      description: { en: 'A restorative treatment for hair and scalp.', gu: 'વાળ અને માથાની ત્વચા માટે પુનઃતાજગી આપતી સારવાર.' },
      priceMinorUnits: 80000,
      durationMinutes: 50,
      active: true,
    },
  ],
  barbers: [
    { id: 'stylist-01', name: { en: 'Stylist 01', gu: 'સ્ટાઈલિસ્ટ ૦૧' }, active: true, availability: 'AVAILABLE' },
    { id: 'stylist-02', name: { en: 'Stylist 02', gu: 'સ્ટાઈલિસ્ટ ૦૨' }, active: true, availability: 'AVAILABLE' },
    { id: 'stylist-03', name: { en: 'Stylist 03', gu: 'સ્ટાઈલિસ્ટ ૦૩' }, active: true, availability: 'ON_BREAK' },
  ],
}
