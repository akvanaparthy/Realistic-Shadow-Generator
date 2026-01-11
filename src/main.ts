import { ShadowApp } from './core/app';
import { LightParameters, ShadowParameters, GeneratedShadow, PositionPreset } from './core/types';
import { Exporter } from './core/exporter';

class ShadowStudioUI {
  private app: ShadowApp;
  private currentResult: GeneratedShadow | null = null;
  private currentView: 'composite' | 'shadow' | 'mask' = 'composite';
  private depthMapLoaded = false;
  private depthMapEnabled = false;
  private autoCutoutEnabled = false;
  private resizeImageType: 'foreground' | 'background' | null = null;
  private aspectRatioLocked = true;
  private originalAspectRatio = 1;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartPosX = 0;
  private dragStartPosY = 0;

  private elements = {
    foregroundInput: document.getElementById('foreground-input') as HTMLInputElement,
    backgroundInput: document.getElementById('background-input') as HTMLInputElement,
    depthInput: document.getElementById('depth-input') as HTMLInputElement,
    foregroundZone: document.getElementById('foreground-zone') as HTMLElement,
    backgroundZone: document.getElementById('background-zone') as HTMLElement,
    depthZone: document.getElementById('depth-zone') as HTMLElement,
    foregroundRemove: document.getElementById('foreground-remove') as HTMLButtonElement,
    backgroundRemove: document.getElementById('background-remove') as HTMLButtonElement,
    depthRemove: document.getElementById('depth-remove') as HTMLButtonElement,
    autoCutoutToggleContainer: document.getElementById('auto-cutout-toggle-container') as HTMLElement,
    autoCutoutToggle: document.getElementById('auto-cutout-toggle') as HTMLElement,
    depthToggleContainer: document.getElementById('depth-toggle-container') as HTMLElement,
    depthToggle: document.getElementById('depth-toggle') as HTMLElement,

    angleSlider: document.getElementById('angle-slider') as HTMLInputElement,
    elevationSlider: document.getElementById('elevation-slider') as HTMLInputElement,
    darknessSlider: document.getElementById('darkness-slider') as HTMLInputElement,
    blurSlider: document.getElementById('blur-slider') as HTMLInputElement,
    falloffSlider: document.getElementById('falloff-slider') as HTMLInputElement,

    angleValue: document.getElementById('angle-value') as HTMLElement,
    elevationValue: document.getElementById('elevation-value') as HTMLElement,
    darknessValue: document.getElementById('darkness-value') as HTMLElement,
    blurValue: document.getElementById('blur-value') as HTMLElement,
    falloffValue: document.getElementById('falloff-value') as HTMLElement,

    canvasContainer: document.getElementById('canvas-container') as HTMLElement,
    canvasOverlay: document.getElementById('canvas-overlay') as HTMLElement,
    dragIndicator: document.getElementById('drag-indicator') as HTMLElement,

    exportComposite: document.getElementById('export-composite') as HTMLButtonElement,
    exportShadow: document.getElementById('export-shadow') as HTMLButtonElement,
    exportMask: document.getElementById('export-mask') as HTMLButtonElement,
    exportAll: document.getElementById('export-all') as HTMLButtonElement,

    foregroundResizeBtn: document.getElementById('foreground-resize-btn') as HTMLButtonElement,
    backgroundResizeBtn: document.getElementById('background-resize-btn') as HTMLButtonElement,
    resizeModalBackdrop: document.getElementById('resize-modal-backdrop') as HTMLElement,
    resizeModal: document.getElementById('resize-modal') as HTMLElement,
    resizeModalClose: document.getElementById('resize-modal-close') as HTMLButtonElement,
    currentDimensions: document.getElementById('current-dimensions') as HTMLElement,
    resizeWidthInput: document.getElementById('resize-width-input') as HTMLInputElement,
    resizeHeightInput: document.getElementById('resize-height-input') as HTMLInputElement,
    resizeAspectLock: document.getElementById('resize-aspect-lock') as HTMLButtonElement,
    resizeCancel: document.getElementById('resize-cancel') as HTMLButtonElement,
    resizeApply: document.getElementById('resize-apply') as HTMLButtonElement,
  };

  constructor() {
    this.app = new ShadowApp();
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.elements.foregroundInput.addEventListener('change', (e) => this.handleForegroundUpload(e));
    this.elements.backgroundInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
    this.elements.depthInput.addEventListener('change', (e) => this.handleDepthUpload(e));

    this.elements.foregroundRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearForeground();
    });
    this.elements.backgroundRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearBackground();
    });
    this.elements.depthRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearDepth();
    });

    this.elements.autoCutoutToggle.addEventListener('click', () => this.toggleAutoCutout());
    this.elements.depthToggle.addEventListener('click', () => this.toggleDepthMap());

    this.elements.angleSlider.addEventListener('input', () => this.handleControlChange());
    this.elements.elevationSlider.addEventListener('input', () => this.handleControlChange());
    this.elements.darknessSlider.addEventListener('input', () => this.handleControlChange());
    this.elements.blurSlider.addEventListener('input', () => this.handleControlChange());
    this.elements.falloffSlider.addEventListener('input', () => this.handleControlChange());

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const view = (e.target as HTMLElement).dataset.view as 'composite' | 'shadow' | 'mask';
        this.switchView(view);
      });
    });

    this.elements.exportComposite.addEventListener('click', () => this.exportComposite());
    this.elements.exportShadow.addEventListener('click', () => this.exportShadow());
    this.elements.exportMask.addEventListener('click', () => this.exportMask());
    this.elements.exportAll.addEventListener('click', () => this.exportAllImages());

    document.querySelectorAll('.position-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const position = (e.target as HTMLElement).dataset.position as PositionPreset;
        this.handlePositionChange(position);
      });
    });

    this.elements.foregroundResizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openResizeModal('foreground');
    });
    this.elements.backgroundResizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openResizeModal('background');
    });

    this.elements.resizeModalClose.addEventListener('click', () => this.closeResizeModal());
    this.elements.resizeCancel.addEventListener('click', () => this.closeResizeModal());
    this.elements.resizeApply.addEventListener('click', () => this.applyResize());
    this.elements.resizeModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.elements.resizeModalBackdrop) {
        this.closeResizeModal();
      }
    });

    this.elements.resizeAspectLock.addEventListener('click', () => this.toggleAspectLock());
    this.elements.resizeWidthInput.addEventListener('input', () => this.handleResizeWidthChange());
    this.elements.resizeHeightInput.addEventListener('input', () => this.handleResizeHeightChange());

    this.elements.canvasOverlay.addEventListener('mousedown', (e) => this.handleDragStart(e));
    document.addEventListener('mousemove', (e) => this.handleDragMove(e));
    document.addEventListener('mouseup', () => this.handleDragEnd());
  }

  private async handleForegroundUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      if (this.autoCutoutEnabled) {
        this.elements.foregroundZone.classList.add('processing');
        const processedImage = await this.app.loadForegroundWithCutout(file);
        this.elements.foregroundZone.classList.remove('processing');
      } else {
        await this.app.loadForeground(file);
      }
      this.elements.foregroundZone.classList.add('has-file');
      this.regenerateShadow();
    } catch (error) {
      this.elements.foregroundZone.classList.remove('processing');
      console.error('Failed to load foreground:', error);
      alert('Failed to load foreground image');
    }
  }

  private async handleBackgroundUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await this.app.loadBackground(file);
      this.elements.backgroundZone.classList.add('has-file');
      this.app.setPositionPreset('middle-center');
      this.regenerateShadow();
    } catch (error) {
      console.error('Failed to load background:', error);
      alert('Failed to load background image');
    }
  }

  private async handleDepthUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await this.app.loadDepthMap(file);
      this.elements.depthZone.classList.add('has-file');
      this.elements.depthToggleContainer.style.display = 'flex';
      this.depthMapLoaded = true;
      this.depthMapEnabled = true;
      this.elements.depthToggle.classList.add('active');
      this.regenerateShadow();
    } catch (error) {
      console.error('Failed to load depth map:', error);
      alert('Failed to load depth map');
    }
  }

  private clearForeground(): void {
    this.elements.foregroundInput.value = '';
    this.elements.foregroundZone.classList.remove('has-file');
    this.currentResult = null;
    this.displayCanvas(null);
  }

  private clearBackground(): void {
    this.elements.backgroundInput.value = '';
    this.elements.backgroundZone.classList.remove('has-file');
    this.currentResult = null;
    this.displayCanvas(null);
  }

  private clearDepth(): void {
    this.elements.depthInput.value = '';
    this.elements.depthZone.classList.remove('has-file');
    this.elements.depthToggleContainer.style.display = 'none';
    this.depthMapLoaded = false;
    this.depthMapEnabled = false;
    this.elements.depthToggle.classList.remove('active');
    this.app.clearDepthMap();
    this.regenerateShadow();
  }

  private toggleAutoCutout(): void {
    this.autoCutoutEnabled = !this.autoCutoutEnabled;
    this.elements.autoCutoutToggle.classList.toggle('active', this.autoCutoutEnabled);
  }

  private toggleDepthMap(): void {
    if (!this.depthMapLoaded) return;

    this.depthMapEnabled = !this.depthMapEnabled;
    this.elements.depthToggle.classList.toggle('active', this.depthMapEnabled);

    if (this.depthMapEnabled) {
      const depthInput = this.elements.depthInput;
      const file = depthInput.files?.[0];
      if (file) {
        this.app.loadDepthMap(file).then(() => this.regenerateShadow());
      }
    } else {
      this.app.clearDepthMap();
      this.regenerateShadow();
    }
  }

  private handlePositionChange(position: PositionPreset): void {
    document.querySelectorAll('.position-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-position="${position}"]`);
    activeBtn?.classList.add('active');

    this.app.setPositionPreset(position);
    this.regenerateShadow();
  }

  private handleControlChange(): void {
    this.elements.angleValue.textContent = this.elements.angleSlider.value;
    this.elements.elevationValue.textContent = this.elements.elevationSlider.value;
    this.elements.darknessValue.textContent = parseFloat(this.elements.darknessSlider.value).toFixed(2);
    this.elements.blurValue.textContent = this.elements.blurSlider.value;
    this.elements.falloffValue.textContent = this.elements.falloffSlider.value;

    this.regenerateShadow();
  }

  private regenerateShadow(): void {
    if (!this.app.isReady()) return;

    const light: LightParameters = {
      angle: parseFloat(this.elements.angleSlider.value),
      elevation: parseFloat(this.elements.elevationSlider.value),
    };

    const shadow: ShadowParameters = {
      contactDarkness: parseFloat(this.elements.darknessSlider.value),
      maxBlurRadius: parseFloat(this.elements.blurSlider.value),
      falloffDistance: parseFloat(this.elements.falloffSlider.value),
    };

    this.currentResult = this.app.generate(light, shadow);

    if (this.currentResult) {
      this.updatePreview();
    }
  }

  private updatePreview(): void {
    if (!this.currentResult) return;

    const canvas = this.getCanvasForView(this.currentView);
    this.displayCanvas(canvas);
  }

  private getCanvasForView(view: 'composite' | 'shadow' | 'mask'): HTMLCanvasElement | null {
    if (!this.currentResult) return null;

    switch (view) {
      case 'composite':
        return this.currentResult.composite;
      case 'shadow':
        return this.currentResult.shadowOnly;
      case 'mask':
        return this.currentResult.maskDebug;
      default:
        return null;
    }
  }

  private displayCanvas(canvas: HTMLCanvasElement | null): void {
    const existingCanvas = this.elements.canvasContainer.querySelector('canvas');
    const emptyState = this.elements.canvasContainer.querySelector('.empty-state');

    if (existingCanvas) {
      existingCanvas.remove();
    }
    if (emptyState) {
      emptyState.remove();
    }

    if (canvas) {
      this.elements.canvasContainer.insertBefore(canvas, this.elements.canvasOverlay);
      this.elements.canvasOverlay.classList.add('active');
    } else {
      const emptyStateEl = document.createElement('div');
      emptyStateEl.className = 'empty-state';
      emptyStateEl.innerHTML = `
        <div class="empty-state-icon">◐</div>
        <div>Upload foreground and background images to begin</div>
      `;
      this.elements.canvasContainer.insertBefore(emptyStateEl, this.elements.canvasOverlay);
      this.elements.canvasOverlay.classList.remove('active');
    }
  }

  private switchView(view: 'composite' | 'shadow' | 'mask'): void {
    this.currentView = view;

    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    const activeTab = document.querySelector(`.tab[data-view="${view}"]`);
    activeTab?.classList.add('active');

    this.updatePreview();
  }

  private async exportComposite(): Promise<void> {
    if (!this.currentResult) return;
    await Exporter.downloadCanvas(this.currentResult.composite, 'composite.png');
  }

  private async exportShadow(): Promise<void> {
    if (!this.currentResult) return;
    await Exporter.downloadCanvas(this.currentResult.shadowOnly, 'shadow_only.png');
  }

  private async exportMask(): Promise<void> {
    if (!this.currentResult) return;
    await Exporter.downloadCanvas(this.currentResult.maskDebug, 'mask_debug.png');
  }

  private async exportAllImages(): Promise<void> {
    if (!this.currentResult) return;
    await this.app.exportAll(this.currentResult);
  }

  private openResizeModal(imageType: 'foreground' | 'background'): void {
    this.resizeImageType = imageType;
    const dimensions = imageType === 'foreground'
      ? this.app.getForegroundDimensions()
      : this.app.getBackgroundDimensions();

    if (!dimensions) return;

    this.originalAspectRatio = dimensions.width / dimensions.height;
    this.elements.currentDimensions.textContent = `${dimensions.width} × ${dimensions.height}`;
    this.elements.resizeWidthInput.value = dimensions.width.toString();
    this.elements.resizeHeightInput.value = dimensions.height.toString();

    this.aspectRatioLocked = true;
    this.elements.resizeAspectLock.classList.add('locked');

    this.elements.resizeModalBackdrop.classList.add('active');
  }

  private closeResizeModal(): void {
    this.elements.resizeModalBackdrop.classList.remove('active');
    this.resizeImageType = null;
  }

  private toggleAspectLock(): void {
    this.aspectRatioLocked = !this.aspectRatioLocked;
    this.elements.resizeAspectLock.classList.toggle('locked', this.aspectRatioLocked);
    const lockIcon = this.elements.resizeAspectLock.querySelector('.lock-icon');
    if (lockIcon) {
      lockIcon.textContent = this.aspectRatioLocked ? '🔒' : '🔓';
    }
  }

  private handleResizeWidthChange(): void {
    if (!this.aspectRatioLocked) return;
    const width = parseInt(this.elements.resizeWidthInput.value) || 1;
    const height = Math.round(width / this.originalAspectRatio);
    this.elements.resizeHeightInput.value = height.toString();
  }

  private handleResizeHeightChange(): void {
    if (!this.aspectRatioLocked) return;
    const height = parseInt(this.elements.resizeHeightInput.value) || 1;
    const width = Math.round(height * this.originalAspectRatio);
    this.elements.resizeWidthInput.value = width.toString();
  }

  private applyResize(): void {
    const width = parseInt(this.elements.resizeWidthInput.value);
    const height = parseInt(this.elements.resizeHeightInput.value);

    if (!width || !height || width < 1 || height < 1) {
      alert('Please enter valid dimensions');
      return;
    }

    if (this.resizeImageType === 'foreground') {
      this.app.resizeForeground(width, height);
    } else if (this.resizeImageType === 'background') {
      this.app.resizeBackground(width, height);
    }

    this.regenerateShadow();
    this.closeResizeModal();
  }

  private handleDragStart(e: MouseEvent): void {
    if (this.currentView !== 'composite') return;
    if (!this.app.isReady()) return;

    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    const currentPos = this.app.getPosition();
    this.dragStartPosX = currentPos.x;
    this.dragStartPosY = currentPos.y;

    this.elements.canvasOverlay.classList.add('dragging');
    const fgDims = this.app.getForegroundDimensions();
    if (fgDims) {
      this.elements.dragIndicator.style.width = `${fgDims.width}px`;
      this.elements.dragIndicator.style.height = `${fgDims.height}px`;
    }
    this.updateDragIndicator(currentPos.x, currentPos.y);
  }

  private handleDragMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;

    const newX = this.dragStartPosX + deltaX;
    const newY = this.dragStartPosY + deltaY;

    this.app.setCustomPosition(newX, newY);
    this.updateDragIndicator(newX, newY);
    this.regenerateShadow();
  }

  private handleDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.elements.canvasOverlay.classList.remove('dragging');
  }

  private updateDragIndicator(x: number, y: number): void {
    const fgDims = this.app.getForegroundDimensions();
    if (!fgDims) return;

    this.elements.dragIndicator.style.left = `${x}px`;
    this.elements.dragIndicator.style.top = `${y}px`;
    this.elements.dragIndicator.style.width = `${fgDims.width}px`;
    this.elements.dragIndicator.style.height = `${fgDims.height}px`;
  }
}

new ShadowStudioUI();
