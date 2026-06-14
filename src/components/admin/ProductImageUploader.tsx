'use client';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ImagePlus, X, Star, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export interface ProductImage {
  id?: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export default function ProductImageUploader({ images, onChange, maxImages = 8 }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) { toast.error(`Max ${maxImages} images allowed`); return; }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const valid = files.filter(f => validTypes.includes(f.type)).slice(0, remaining);
    if (files.some(f => !validTypes.includes(f.type))) toast.error('Only JPG, PNG, WebP, GIF allowed');
    if (!valid.length) return;

    setUploading(true);
    try {
      const newImages: ProductImage[] = valid.map((file, i) => ({
        url: URL.createObjectURL(file),
        alt_text: file.name.replace(/\.[^.]+$/, ''),
        is_primary: images.length === 0 && i === 0,
        sort_order: images.length + i,
      }));
      onChange([...images, ...newImages]);
      toast.success(`${newImages.length} image(s) added!`);
    } catch {
      toast.error('Failed to process images');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const setPrimary = (index: number) =>
    onChange(images.map((img, i) => ({ ...img, is_primary: i === index })));

  const remove = (index: number) => {
    const updated = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sort_order: i }));
    if (updated.length > 0 && !updated.some(i => i.is_primary)) updated[0].is_primary = true;
    onChange(updated);
  };

  const updateAlt = (index: number, alt: string) =>
    onChange(images.map((img, i) => i === index ? { ...img, alt_text: alt } : img));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Product Images
          <span className="text-gray-400 font-normal ml-1">({images.length}/{maxImages})</span>
        </label>
        {images.length > 0 && (
          <p className="text-xs text-gray-400">Click ⭐ to set primary image</p>
        )}
      </div>

      {/* Drop zone */}
      {images.length < maxImages && (
        <label
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
            isDragging ? 'border-accent bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-accent hover:bg-orange-50/50',
            uploading && 'pointer-events-none opacity-60'
          )}>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleInput} disabled={uploading} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-accent" />
              <p className="text-sm font-medium text-accent">Processing…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <ImagePlus size={20} className="text-accent" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Drop images here or <span className="text-accent">browse</span>
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, WebP · Up to {maxImages} images</p>
            </div>
          )}
        </label>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={`img-${i}`}
              className={cn(
                'relative group rounded-xl overflow-hidden border-2 transition-all bg-gray-100',
                img.is_primary ? 'border-accent' : 'border-gray-200 hover:border-gray-300'
              )}
              style={{ aspectRatio: '1 / 1' }}>
              <Image
                src={img.url}
                alt={img.alt_text || `Image ${i + 1}`}
                fill
                className="object-cover"
                sizes="150px"
              />

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPrimary(i)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors shadow-sm',
                    img.is_primary
                      ? 'bg-accent text-white'
                      : 'bg-white text-gray-700 hover:bg-accent hover:text-white'
                  )}>
                  <Star size={13} className={img.is_primary ? 'fill-current' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1.5 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors shadow-sm">
                  <X size={13} />
                </button>
              </div>

              {/* Badges */}
              {img.is_primary && (
                <div className="absolute top-1.5 left-1.5 bg-accent text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  Primary
                </div>
              )}
              <div className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[9px] w-4 h-4 rounded flex items-center justify-center font-bold">
                {i + 1}
              </div>
            </div>
          ))}

          {/* Add more */}
          {images.length < maxImages && (
            <label
              className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-orange-50/50 transition-all"
              style={{ aspectRatio: '1 / 1' }}>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleInput} disabled={uploading} />
              <Upload size={18} className="text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Add more</span>
            </label>
          )}
        </div>
      )}

      {/* Alt text inputs */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Alt Text (SEO)</p>
          {images.map((img, i) => (
            <div key={`alt-${i}`} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-14 flex-shrink-0 text-right">Image {i + 1}</span>
              <input
                value={img.alt_text || ''}
                onChange={e => updateAlt(i, e.target.value)}
                placeholder={`Describe image ${i + 1}…`}
                className="input py-1.5 text-xs flex-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
