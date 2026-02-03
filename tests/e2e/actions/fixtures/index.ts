import { test as base, expect } from '@playwright/test';
import { AstroActionRequest } from  './astro-actions';
import { createMockServer } from './prism-mock-server';
import path from 'node:path';

const PATH_TO_NINJAODM_OPENAPI_SPEC = path.resolve(
  import.meta.dirname, 
  "../../../../src/assets/ninjaodm.openapi.json"
);

type Fixtures = {
  astroActions: AstroActionRequest;
};

type WorkerFixtures = {
  ninjaodmMockServer: Awaited<ReturnType<typeof createMockServer>>;
}

const test = base.extend<Fixtures, WorkerFixtures>({
  astroActions: async ({ request, baseURL }, use) => {
    const astroActions = new AstroActionRequest(
      request, 
      baseURL || 'http://localhost:4321',
      { trailingSlash: false }
    );
    await use(astroActions);
  },
  ninjaodmMockServer: [async ({}, use) => {
    const mockServer = await createMockServer(PATH_TO_NINJAODM_OPENAPI_SPEC);
    const { port, hostname } = new URL(process.env.NINJAODM_BASE_URL || 'http://localhost:4010');
    mockServer.listen(Number(port), hostname);
    await use(mockServer);
    await mockServer.close();
  }, { scope: 'worker' }],
});

test.beforeAll(async ({ ninjaodmMockServer }) => { ninjaodmMockServer; })

export { test, expect };
