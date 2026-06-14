import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    uploadthingSecret: process.env.UPLOADTHING_SECRET,
    uploadthingAppId: process.env.UPLOADTHING_APP_ID,
  },
});
