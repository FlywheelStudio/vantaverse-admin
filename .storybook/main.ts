import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(storybookDir, '..');

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
  ],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(projectRoot, 'src'),
    };
    // next/image references `process.env.NODE_ENV` at module scope; Vite's
    // preview (unlike webpack) doesn't define `process` by default.
    config.define = {
      ...config.define,
      'process.env.NODE_ENV': JSON.stringify('development'),
    };
    return config;
  },
};

export default config;
