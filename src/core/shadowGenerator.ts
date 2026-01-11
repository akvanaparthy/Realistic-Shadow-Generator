import { ProcessedImage, MaskData, LightParameters, ShadowParameters, GeneratedShadow, ForegroundPosition } from './types';
import { MaskExtractor } from './maskExtractor';

export class ShadowGenerator {
  private foreground: ProcessedImage;
  private background: ProcessedImage;
  private mask: MaskData;
  private depthMap: MaskData | null = null;
  private position: ForegroundPosition;

  constructor(
    foreground: ProcessedImage,
    background: ProcessedImage,
    mask: MaskData,
    position: ForegroundPosition
  ) {
    this.foreground = foreground;
    this.background = background;
    this.mask = mask;
    this.position = position;
  }

  setDepthMap(depthMap: MaskData | null): void {
    this.depthMap = depthMap;
  }

  setPosition(position: ForegroundPosition): void {
    this.position = position;
  }

  generate(light: LightParameters, shadow: ShadowParameters): GeneratedShadow {
    const shadowCanvas = this.createShadowLayer(light, shadow);
    const compositeCanvas = this.createComposite(shadowCanvas);
    const maskDebugCanvas = MaskExtractor.createDebugCanvas(this.mask);

    return {
      composite: compositeCanvas,
      shadowOnly: shadowCanvas,
      maskDebug: maskDebugCanvas
    };
  }

  private createShadowLayer(light: LightParameters, shadow: ShadowParameters): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.background.width;
    canvas.height = this.background.height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get canvas context');

    const offset = this.calculateShadowOffset(light);
    const contactY = MaskExtractor.findContactPoint(this.mask);
    const absoluteContactY = this.position.y + contactY;

    const imageData = ctx.createImageData(this.background.width, this.background.height);
    const pixels = imageData.data;

    for (let bgY = 0; bgY < this.background.height; bgY++) {
      for (let bgX = 0; bgX < this.background.width; bgX++) {
        const sourceX = Math.round(bgX - this.position.x - offset.x);
        const sourceY = Math.round(bgY - this.position.y - offset.y);

        if (sourceX >= 0 && sourceX < this.mask.width && sourceY >= 0 && sourceY < this.mask.height) {
          const sourceIndex = sourceY * this.mask.width + sourceX;

          if (this.mask.data[sourceIndex] > 128) {
            const distanceFromContact = Math.abs(bgY - (absoluteContactY + offset.y));
            const normalizedDistance = Math.min(distanceFromContact / shadow.falloffDistance, 1);

            let opacity = this.calculateOpacity(normalizedDistance, shadow);

            if (this.depthMap && bgX >= 0 && bgX < this.depthMap.width && bgY >= 0 && bgY < this.depthMap.height) {
              const depthIndex = bgY * this.depthMap.width + bgX;
              const depthValue = this.depthMap.data[depthIndex] / 255;
              opacity *= (1 - depthValue * 0.3);
            }

            const pixelIndex = (bgY * this.background.width + bgX) * 4;
            pixels[pixelIndex] = 0;
            pixels[pixelIndex + 1] = 0;
            pixels[pixelIndex + 2] = 0;
            pixels[pixelIndex + 3] = Math.round(opacity * 255);
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const blurredCanvas = this.applyBlur(canvas, shadow.maxBlurRadius);
    return blurredCanvas;
  }

  private calculateShadowOffset(light: LightParameters): { x: number; y: number } {
    const angleRad = (light.angle * Math.PI) / 180;
    const elevationRad = (light.elevation * Math.PI) / 180;

    const shadowLength = 200 * (1 - Math.sin(elevationRad));

    const x = Math.cos(angleRad) * shadowLength;
    const y = Math.sin(angleRad) * shadowLength;

    return { x, y };
  }

  private calculateOpacity(normalizedDistance: number, shadow: ShadowParameters): number {
    const contactBoost = Math.exp(-normalizedDistance * 4) * shadow.contactDarkness;
    const baseOpacity = 0.5 * (1 - normalizedDistance * 0.8);
    return Math.min(contactBoost + baseOpacity, 1);
  }

  private applyBlur(canvas: HTMLCanvasElement, blurRadius: number): HTMLCanvasElement {
    const blurred = document.createElement('canvas');
    blurred.width = canvas.width;
    blurred.height = canvas.height;

    const ctx = blurred.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(canvas, 0, 0);

    return blurred;
  }

  private createComposite(shadowCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.background.width;
    canvas.height = this.background.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(this.background.canvas, 0, 0);

    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.85;
    ctx.drawImage(shadowCanvas, 0, 0);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.drawImage(this.foreground.canvas, this.position.x, this.position.y);

    return canvas;
  }
}
