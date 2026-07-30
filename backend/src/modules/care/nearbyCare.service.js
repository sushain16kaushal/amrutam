const EARTH_RADIUS_KM = 6371;

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearbyCare = async ({ latitude, longitude, radiusMeters = 8000, limit = 5 }) => {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
    );
    out center ${limit * 3};
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Accept': 'application/json',
      'User-Agent': 'Amrutam-Telemedicine/1.0' // Overpass ka Apache-proxy iske bina 406 deta hai
    },
    body: query
  });
  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const data = await res.json();

  return (data.elements || [])
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon) return null;
      return {
        name: el.tags?.name || 'Unnamed clinic/hospital',
        type: el.tags?.amenity,
        latitude: lat,
        longitude: lon,
        distanceKm: Number(haversineDistanceKm(latitude, longitude, lat, lon).toFixed(1)),
        directionsUrl: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${latitude}%2C${longitude}%3B${lat}%2C${lon}`
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};