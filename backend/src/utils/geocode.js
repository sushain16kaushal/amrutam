// Nominatim geocoding — city+country se lat/lng nikalta hai, ek-baar registration/profile-update pe
export const geocodeCityCountry = async (city, countryCode) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&city=${encodeURIComponent(city)}&countrycodes=${countryCode.toLowerCase()}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Amrutam-Telemedicine/1.0 (support@amrutam.example)' } // Nominatim policy — User-Agent zaroori hai
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.length) return null;

  return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
};