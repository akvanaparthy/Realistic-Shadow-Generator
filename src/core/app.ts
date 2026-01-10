import { ImageLoader } from './imageLoader';
import { MaskExtractor } from './maskExtractor';
import { ShadowGenerator } from './shadowGenerator';
import { Exporter } from './exporter';
import { ProcessedImage, MaskData, LightParameters, ShadowParameters, GeneratedShadow } from './types';

export class ShadowApp {
  private foreground: ProcessedImage | null = null;
  private background: ProcessedImage | null = null;
  private depthMap: MaskData | null = null;
  private mask: MaskData | null = null;
  private generator: ShadowGenerator | null = null;

  async loadForeground(file: File): Promise<void> {
    this.foreground = await ImageLoader.loadFromFile(file);
    this.mask = MaskExtractor.extractFromAlpha(this.foreground);
    this.updateGenerator();
  }

  async loadBackground(file: File): Promise<void> {
    this.background = await ImageLoader.loadFromFile(file);
    this.updateGenerator();
  }

  async loadDepthMap(file: File): Promise<void> {
    const depthImage = await ImageLoader.loadFromFile(file);
    const ctx = depthImage.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get context');

    const imageData = ctx.getImageData(0, 0, depthImage.width, depthImage.height);
    const pixels = imageData.data;
    const depthData = new Uint8ClampedArray(depthImage.width * depthImage.height);

    for (let i = 0; i < depthData.length; i++) {
      depthData[i] = pixels[i * 4];
    }

    this.depthMap = {
      data: depthData,
      width: depthImage.width,
      height: depthImage.height
    };

    if (this.generator) {
      this.generator.setDepthMap(this.depthMap);
    }
  }

  clearDepthMap(): void {
    this.depthMap = null;
    if (this.generator) {
      this.generator.setDepthMap(null);
    }
  }

  private updateGenerator(): void {
    if (this.foreground && this.background && this.mask) {
      this.generator = new ShadowGenerator(this.foreground, this.background, this.mask);
      if (this.depthMap) {
        this.generator.setDepthMap(this.depthMap);
      }
    }
  }

  generate(light: LightParameters, shadow: ShadowParameters): GeneratedShadow | null {
    if (!this.generator) {
      return null;
    }
    return this.generator.generate(light, shadow);
  }

  async exportAll(result: GeneratedShadow): Promise<void> {
    await Exporter.downloadAll(result.composite, result.shadowOnly, result.maskDebug);
  }

  isReady(): boolean {
    return this.generator !== null;
  }

  getMaskDebug(): HTMLCanvasElement | null {
    if (!this.mask) return null;
    return MaskExtractor.createDebugCanvas(this.mask);
  }
}
