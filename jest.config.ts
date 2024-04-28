import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  rootDir: "src",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  coverageDirectory: "../coverage",
};
export default config;
