// migrations/<timestamp>_add-location-coords.js
export const up = (pgm) => {
  pgm.addColumns('profiles', {
    latitude: { type: 'decimal(9,6)' },
    longitude: { type: 'decimal(9,6)' }
  });
};

export const down = (pgm) => {
  pgm.dropColumns('profiles', ['latitude', 'longitude']);
};
