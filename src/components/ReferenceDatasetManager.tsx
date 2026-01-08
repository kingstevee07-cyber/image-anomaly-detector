import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, FolderOpen, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ReferenceImage,
  uploadReferenceImage,
  getReferenceImages,
  deleteReferenceImage,
  getPublicUrl
} from '@/lib/referenceDataset';

interface ReferenceDatasetManagerProps {
  onDatasetChange?: () => void;
}

export function ReferenceDatasetManager({ onDatasetChange }: ReferenceDatasetManagerProps) {
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('default');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const data = await getReferenceImages();
      setImages(data);
    } catch (error) {
      console.error('Failed to load reference images:', error);
      toast.error('Failed to load reference images');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        await uploadReferenceImage(file, category);
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Uploaded ${successCount} reference image(s)`);
        await loadImages();
        onDatasetChange?.();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image(s)');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (image: ReferenceImage) => {
    try {
      await deleteReferenceImage(image.id, image.file_path);
      toast.success('Reference image deleted');
      await loadImages();
      onDatasetChange?.();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete image');
    }
  };

  const categories = [...new Set(images.map(img => img.category))];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Reference Dataset
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="category" className="text-sm text-muted-foreground">
              Category
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value || 'default')}
              placeholder="e.g., normal, defective"
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Label className="cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button asChild disabled={uploading}>
                <span>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Normal Images
                </span>
              </Button>
            </Label>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Upload images that represent "normal" samples. New images will be compared against these to detect anomalies.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No reference images uploaded yet</p>
            <p className="text-sm">Upload normal samples to build your reference dataset</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {cat} ({images.filter(img => img.category === cat).length})
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {images
                    .filter((img) => img.category === cat)
                    .map((image) => (
                      <div
                        key={image.id}
                        className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                      >
                        <img
                          src={getPublicUrl(image.file_path)}
                          alt={image.file_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(image)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                          <p className="text-[10px] text-white truncate">{image.file_name}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Total: {images.length} reference image(s)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
