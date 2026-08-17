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
    return config;
  },
};

export default config;
