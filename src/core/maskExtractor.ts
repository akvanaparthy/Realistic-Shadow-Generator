import { ProcessedImage, MaskData } from './types';

export class MaskExtractor {
  static extractFromAlpha(image: ProcessedImage): MaskData {
    const ctx = image.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const pixels = imageData.data;
    const mask = new Uint8ClampedArray(image.width * image.height);

    for (let i = 0; i < image.width * image.height; i++) {
      const alphaValue = pixels[i * 4 + 3];
      mask[i] = alphaValue > 128 ? 255 : 0;
    }

    return {
      data: mask,
      width: image.width,
      height: image.height
    };
  }

  static createDebugCanvas(maskData: MaskData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = maskData.width;
    canvas.height = maskData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.createImageData(maskData.width, maskData.height);
    const pixels = imageData.data;

    for (let i = 0; i < maskData.data.length; i++) {
      const value = maskData.data[i];
      pixels[i * 4] = value;
      pixels[i * 4 + 1] = value;
      pixels[i * 4 + 2] = value;
      pixels[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  static findContactPoint(maskData: MaskData): number {
    for (let y = maskData.height - 1; y >= 0; y--) {
      for (let x = 0; x < maskData.width; x++) {
        const index = y * maskData.width + x;
        if (maskData.data[index] > 128) {
          return y;
        }
      }
    }
    return maskData.height - 1;
  }
}
