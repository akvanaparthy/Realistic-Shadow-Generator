export interface LightParameters {
  angle: number;
  elevation: number;
}

export interface ShadowParameters {
  contactDarkness: number;
  maxBlurRadius: number;
  falloffDistance: number;
}

export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface MaskData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface GeneratedShadow {
  composite: HTMLCanvasElement;
  shadowOnly: HTMLCanvasElement;
  maskDebug: HTMLCanvasElement;
}
