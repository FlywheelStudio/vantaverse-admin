import type { Preview } from '@storybook/react';
/* globals.css loads fonts (@import first) + tokens; do not import tokens alone
   or a nested fonts @import ends up after other rules when bundled. */
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
