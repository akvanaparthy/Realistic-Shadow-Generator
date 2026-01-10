export class Exporter {
  static async downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
    const blob = await this.canvasToBlob(canvas);
    this.downloadBlob(blob, filename);
  }

  static canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        1.0
      );
    });
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async downloadAll(
    composite: HTMLCanvasElement,
    shadowOnly: HTMLCanvasElement,
    maskDebug: HTMLCanvasElement
  ): Promise<void> {
    await this.downloadCanvas(composite, 'composite.png');
    await this.downloadCanvas(shadowOnly, 'shadow_only.png');
    await this.downloadCanvas(maskDebug, 'mask_debug.png');
  }
}
