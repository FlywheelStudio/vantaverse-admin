import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: [
    'src/components/ui/**/*.tsx',
    'src/lib/supabase/**/*.ts',
    'src/hooks/**/*.ts',
    'src/context/**/*.tsx',
    'src/lib/utils.ts',
  ],
  ignoreBinaries: [],
  ignoreDependencies: [
    'tw-animate-css',
    '@commitlint/config-conventional',
    '@commitlint/cli',
    'commitlint',
    'cmdk',
  ],
  project: ['src/**/*.{js,ts,jsx,tsx}'],
};

export default config;
