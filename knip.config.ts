import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: [
    'src/components/ui/**/*.tsx',
    // TODO: Remove this ignore when we have our own implementation
    'src/lib/supabase/**/*.ts',
    'src/hooks/**/*.ts',
    'src/context/**/*.tsx',
    'src/lib/utils.ts',
  ],
  ignoreBinaries: [],
  ignoreDependencies: [
    'tw-animate-css',
    'tailwindcss',
    '@commitlint/config-conventional',
  ],
  project: ['src/**/*.{js,ts,jsx,tsx}'],
};

export default config;
