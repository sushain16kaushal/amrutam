module.exports = {
  testEnvironment: 'node',
  globalTeardown: './tests/globalTeardown.js', // NEW
  testTimeout: 15000 // safety — koi single test 15 sec se zyada na atke
};