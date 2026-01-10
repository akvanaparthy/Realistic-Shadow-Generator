export interface LightParams {
  angle: number;
  elevation: number;
}

export interface ShadowConfig {
  light: LightParams;
  contactDarkness: number;
  maxBlur: number;
  maxDistance: number;
}

export interface ImageData {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface ShadowResult {
  composite: HTMLCanvasElement;
  shadowOnly: HTMLCanvasElement;
  maskDebug: HTMLCanvasElement;
}
