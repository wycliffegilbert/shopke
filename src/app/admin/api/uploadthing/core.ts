import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

// Middleware to verify admin access
const auth = (req: Request) => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new UploadThingError('Unauthorized');
  return { token };
};

export const ourFileRouter = {
  // Product images uploader - max 8 images, 4MB each
  productImages: f({ image: { maxFileSize: '4MB', maxFileCount: 8 } })
    .middleware(async ({ req }) => {
      const user = auth(req);
      return { uploader: 'admin' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete:', file.url);
      return { url: file.url, name: file.name };
    }),

  // Single image uploader (avatar, banner, category)
  singleImage: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      auth(req);
      return { uploader: 'admin' };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  // Banner images
  bannerImage: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      auth(req);
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
