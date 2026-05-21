import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW server used by Vitest. Started in src/test/setup.ts. */
export const server = setupServer(...handlers);
