import { ShadowConfig, ShadowResult } from './types';

export class ShadowGenerator {
  private foregroundCanvas: HTMLCanvasElement;
  private backgroundCanvas: HTMLCanvasElement;
  private mask: Uint8ClampedArray;
  private width: number;
  private height: number;
  private depthMap: Uint8ClampedArray | null = null;

  constructor(
    foregroundCanvas: HTMLCanvasElement,
    backgroundCanvas: HTMLCanvasElement,
    mask: Uint8ClampedArray
  ) {
    this.foregroundCanvas = foregroundCanvas;
    this.backgroundCanvas = backgroundCanvas;
    this.mask = mask;
    this.width = foregroundCanvas.width;
    this.height = foregroundCanvas.height;
  }

  setDepthMap(depthMap: Uint8ClampedArray | null) {
    this.depthMap = depthMap;
  }

  generate(config: ShadowConfig): ShadowResult {
    const shadowCanvas = this.createShadowLayer(config);
    const compositeCanvas = this.createComposite(shadowCanvas);
    const maskCanvas = this.createMaskDebug();

    return {
      composite: compositeCanvas,
      shadowOnly: shadowCanvas,
      maskDebug: maskCanvas
    };
  }

  private createShadowLayer(config: ShadowConfig): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');

    const { offsetX, offsetY } = this.calculateShadowOffset(config.light);
    const contactY = this.findContactPoint();

    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const sourceX = x - offsetX;
        const sourceY = y - offsetY;

        if (sourceX >= 0 && sourceX < this.width && sourceY >= 0 && sourceY < this.height) {
          const sourceIdx = sourceY * this.width + sourceX;

          if (this.mask[sourceIdx] > 128) {
            const distanceFromContact = Math.abs(y - (contactY + offsetY));
            const normalizedDistance = Math.min(distanceFromContact / config.maxDistance, 1);

            let opacity = this.calculateOpacity(normalizedDistance, config);
            let blur = this.calculateBlur(normalizedDistance, config);

            if (this.depthMap) {
              const depthValue = this.depthMap[y * this.width + x] / 255;
              opacity *= (1 - depthValue * 0.3);
            }

            const pixelIdx = (y * this.width + x) * 4;
            data[pixelIdx] = 0;
            data[pixelIdx + 1] = 0;
            data[pixelIdx + 2] = 0;
            data[pixelIdx + 3] = opacity * 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const blurredCanvas = this.applyVariableBlur(canvas, config);
    return blurredCanvas;
  }

  private calculateShadowOffset(light: { angle: number; elevation: number }): { offsetX: number; offsetY: number } {
    const angleRad = (light.angle * Math.PI) / 180;
    const elevationRad = (light.elevation * Math.PI) / 180;

    const shadowLength = 200 * (1 - Math.sin(elevationRad));

    const offsetX = Math.cos(angleRad) * shadowLength;
    const offsetY = Math.sin(angleRad) * shadowLength;

    return { offsetX: Math.round(offsetX), offsetY: Math.round(offsetY) };
  }

  private findContactPoint(): number {
    for (let y = this.height - 1; y >= 0; y--) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (this.mask[idx] > 128) {
          return y;
        }
      }
    }
    return this.height - 1;
  }

  private calculateOpacity(normalizedDistance: number, config: ShadowConfig): number {
    const contactBoost = Math.exp(-normalizedDistance * 3) * config.contactDarkness;
    const baseOpacity = 0.4 * (1 - normalizedDistance * 0.7);
    return Math.min(contactBoost + baseOpacity, 1);
  }

  private calculateBlur(normalizedDistance: number, config: ShadowConfig): number {
    return normalizedDistance * config.maxBlur;
  }

  private applyVariableBlur(canvas: HTMLCanvasElement, config: ShadowConfig): HTMLCanvasElement {
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = canvas.width;
    blurCanvas.height = canvas.height;

    const ctx = blurCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.filter = `blur(${config.maxBlur * 0.3}px)`;
    ctx.drawImage(canvas, 0, 0);

    return blurCanvas;
  }

  private createComposite(shadowCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(this.backgroundCanvas, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.8;
    ctx.drawImage(shadowCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(this.foregroundCanvas, 0, 0);

    return canvas;
  }

  private createMaskDebug(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let i = 0; i < this.mask.length; i++) {
      const val = this.mask[i];
      data[i * 4] = val;
      data[i * 4 + 1] = val;
      data[i * 4 + 2] = val;
      data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}
