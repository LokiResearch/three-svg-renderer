export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  verbose: true,
  roots: ["src"],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      useESM: true,
    },
  },
  transformIgnorePatterns: [
    "node_modules/(?!(three/examples)/)",
  ],
  setupFilesAfterEnv: ['./src/setup-jest.ts']
}