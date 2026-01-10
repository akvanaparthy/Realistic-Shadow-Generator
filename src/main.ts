import { ShadowApp } from './core/app';
import { LightParameters, ShadowParameters, GeneratedShadow } from './core/types';
import { Exporter } from './core/exporter';

class ShadowStudioUI {
  private app: ShadowApp;
  private currentResult: GeneratedShadow | null = null;
  private currentView: 'composite' | 'shadow' | 'mask' = 'composite';
  private depthMapLoaded = false;
  private depthMapEnabled = false;

  private elements = {
    foregroundInput: document.getElementById('foreground-input') as HTMLInputElement,
    backgroundInput: document.getElementById('background-input') as HTMLInputElement,
    depthInput: document.getElementById('depth-input') as HTMLInputElement,
    foregroundZone: document.getElementById('foreground-zone') as HTMLElement,
    backgroundZone: document.getElementById('background-zone') as HTMLElement,
    depthZone: document.getElementById('depth-zone') as HTMLElement,
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

    exportComposite: document.getElementById('export-composite') as HTMLButtonElement,
    exportShadow: document.getElementById('export-shadow') as HTMLButtonElement,
    exportMask: document.getElementById('export-mask') as HTMLButtonElement,
    exportAll: document.getElementById('export-all') as HTMLButtonElement,
  };

  constructor() {
    this.app = new ShadowApp();
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.elements.foregroundInput.addEventListener('change', (e) => this.handleForegroundUpload(e));
    this.elements.backgroundInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
    this.elements.depthInput.addEventListener('change', (e) => this.handleDepthUpload(e));

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
  }

  private async handleForegroundUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await this.app.loadForeground(file);
      this.elements.foregroundZone.classList.add('has-file');
      this.regenerateShadow();
    } catch (error) {
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
    this.elements.canvasContainer.innerHTML = '';

    if (canvas) {
      this.elements.canvasContainer.appendChild(canvas);
    } else {
      this.elements.canvasContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">◐</div>
          <div>Upload foreground and background images to begin</div>
        </div>
      `;
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
}

new ShadowStudioUI();
