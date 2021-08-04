module.exports = {
  coveragePathIgnorePatterns: ['node_modules', 'src/types.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>'],
  transform: {
    '\\.(js|ts|tsx)$': 'babel-jest',
  },
  testRegex: '/__tests__/.*\\.(ts|tsx|js)$',
  verbose: true,
};
