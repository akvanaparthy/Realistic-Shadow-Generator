export interface LightParameters {
  angle: number;
  elevation: number;
  intensity: number;
  distance: number;
}

export interface ShadowParameters {
  contactDarkness: number;
  maxBlurRadius: number;
  falloffDistance: number;
}

export type PositionPreset =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ForegroundPosition {
  x: number;
  y: number;
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
