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

    const contactY = MaskExtractor.findContactPoint(this.mask);
    const absoluteContactY = this.position.y + contactY;

    const imageData = ctx.createImageData(this.background.width, this.background.height);
    const pixels = imageData.data;

    const angleRad = (light.angle * Math.PI) / 180;
    const elevationRad = (light.elevation * Math.PI) / 180;

    const lightHeight = 500;
    const lightDist = lightHeight / Math.tan(elevationRad + 0.01);
    const lightX = Math.cos(angleRad) * lightDist;
    const lightY = Math.sin(angleRad) * lightDist;

    for (let srcY = 0; srcY < this.mask.height; srcY++) {
      for (let srcX = 0; srcX < this.mask.width; srcX++) {
        const sourceIndex = srcY * this.mask.width + srcX;

        if (this.mask.data[sourceIndex] > 128) {
          const objX = this.position.x + srcX;
          const objY = this.position.y + srcY;
          const objHeight = Math.max((contactY - srcY) * 0.5, 0);

          const groundY = absoluteContactY;

          if (elevationRad > 0.01) {
            const t = (lightHeight - objHeight) / lightHeight;

            const shadowX = objX + lightX * (1 - t);
            const shadowY = groundY + lightY * (1 - t);

            const bgX = Math.round(shadowX);
            const bgY = Math.round(shadowY);

            if (bgX >= 0 && bgX < this.background.width && bgY >= 0 && bgY < this.background.height) {
              const distanceFromContact = Math.abs(bgY - groundY);
              const normalizedDistance = Math.min(distanceFromContact / shadow.falloffDistance, 1);

              let opacity = this.calculateOpacity(normalizedDistance, shadow, light.intensity);

              if (this.depthMap && bgX >= 0 && bgX < this.depthMap.width && bgY >= 0 && bgY < this.depthMap.height) {
                const depthIndex = bgY * this.depthMap.width + bgX;
                const depthValue = this.depthMap.data[depthIndex] / 255;
                opacity *= (1 - depthValue * 0.3);
              }

              const pixelIndex = (bgY * this.background.width + bgX) * 4;
              const currentAlpha = pixels[pixelIndex + 3] / 255;
              const newAlpha = Math.max(currentAlpha, opacity);

              pixels[pixelIndex] = 0;
              pixels[pixelIndex + 1] = 0;
              pixels[pixelIndex + 2] = 0;
              pixels[pixelIndex + 3] = Math.round(newAlpha * 255);
            }
          } else {
            const bgX = Math.round(objX);
            const bgY = Math.round(groundY);

            if (bgX >= 0 && bgX < this.background.width && bgY >= 0 && bgY < this.background.height) {
              const pixelIndex = (bgY * this.background.width + bgX) * 4;
              const opacity = shadow.contactDarkness * light.intensity;
              const currentAlpha = pixels[pixelIndex + 3] / 255;
              const newAlpha = Math.max(currentAlpha, opacity);

              pixels[pixelIndex] = 0;
              pixels[pixelIndex + 1] = 0;
              pixels[pixelIndex + 2] = 0;
              pixels[pixelIndex + 3] = Math.round(newAlpha * 255);
            }
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

  private calculateOpacity(normalizedDistance: number, shadow: ShadowParameters, intensity: number): number {
    const contactBoost = Math.exp(-normalizedDistance * 4) * shadow.contactDarkness;
    const baseOpacity = 0.5 * (1 - normalizedDistance * 0.8);
    return Math.min((contactBoost + baseOpacity) * intensity, 1);
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
