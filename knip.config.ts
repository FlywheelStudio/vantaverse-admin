import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: [
    'src/components/ui/**/*.tsx',
    'src/lib/supabase/**/*.ts',
    // Transitional until Wave B migrates query modules onto defineQuery/defineMutation.
    // Remove when DAL core has real consumers (or keep only truly unused helpers).
    'src/lib/dal/core/**',
    'src/lib/dal/index.ts',
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
    '@storybook/blocks',
    'eslint-plugin-storybook',
  ],
  project: ['src/**/*.{js,ts,jsx,tsx}'],
};

export default config;
