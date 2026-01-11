import { ProcessedImage } from './types';
import { removeBackground } from '@imgly/background-removal';

export class ImageLoader {
  static async loadFromFile(file: File): Promise<ProcessedImage> {
    const img = await this.createImageFromFile(file);
    return this.imageToCanvas(img);
  }

  static async loadFromUrl(url: string): Promise<ProcessedImage> {
    const img = await this.createImageFromUrl(url);
    return this.imageToCanvas(img);
  }

  private static createImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load image: ${file.name}`));
      };

      img.src = objectUrl;
    });
  }

  private static createImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));

      img.src = url;
    });
  }

  private static imageToCanvas(img: HTMLImageElement): ProcessedImage {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    ctx.drawImage(img, 0, 0);

    return {
      canvas,
      width: img.width,
      height: img.height
    };
  }

  static resizeImage(processedImage: ProcessedImage, newWidth: number, newHeight: number): ProcessedImage {
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(processedImage.canvas, 0, 0, newWidth, newHeight);

    return {
      canvas,
      width: newWidth,
      height: newHeight
    };
  }

  static async removeForegroundBackground(file: File): Promise<ProcessedImage> {
    try {
      const blob = await removeBackground(file);
      const url = URL.createObjectURL(blob);
      const img = await this.createImageFromUrl(url);
      URL.revokeObjectURL(url);
      return this.imageToCanvas(img);
    } catch (error) {
      console.error('Background removal failed:', error);
      throw new Error('Failed to remove background. Loading original image.');
    }
  }
}
