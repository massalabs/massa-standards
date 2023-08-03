module.exports = {
  extends: [
    '@massalabs',
  ],
  rules: {
    'new-cap': ['error', { newIsCap: false }],
    "camelcase": [2, {"allow": ["_"]}],
  }
};
