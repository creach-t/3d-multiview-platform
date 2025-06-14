/**
 * ExportPreviewIntegration.js - UI Integration for Export Preview Mode
 * FIXED: Force ratio 1920/1080 = 1.778 et debug détaillé
 */

import { ViewportRatioManager } from './ViewportRatioManager.js';

export class ExportPreviewIntegration {
  constructor(app, cameraManager, imageExporter) {
    this.app = app;
    this.cameraManager = cameraManager;
    this.imageExporter = imageExporter;
    
    this.viewportRatioManager = new ViewportRatioManager();
    
    this.exportPreviewActive = false;
    this.currentExportPreset = 'turbosquid_product';
    
    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
    
    // Debug button
    this.addDebugButton();
    
    console.log('🎯 Export Preview Integration initialized');
  }

  /**
   * AJOUT: Bouton debug pour voir l'état
   */
  addDebugButton() {
    this.debugBtn = this.createElement('button', {
      textContent: '🔍 Debug',
      style: `
        position: fixed;
        bottom: 120px;
        right: 20px;
        padding: 5px 10px;
        background: #FF9800;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        z-index: 1000;
      `
    });
    
    this.debugBtn.addEventListener('click', () => this.debugViewports());
  }

  /**
   * Debug détaillé des viewports
   */
  debugViewports() {
    console.log('🔍 === DEBUG VIEWPORTS ===');
    
    // Détecter éléments
    this.viewportRatioManager.debugFoundElements();
    
    // Ratio actuel
    console.log(`Current CSS ratio: ${this.viewportRatioManager.getCurrentRatio()}`);
    
    // Preset actuel
    const preset = this.cameraManager.exportPresets[this.currentExportPreset];
    console.log(`Export preset: ${this.currentExportPreset}`, preset);
    
    // Calculer le bon ratio
    const correctRatio = 1920 / 1080;
    console.log(`Correct ratio should be: ${correctRatio.toFixed(3)}`);
    
    // État des caméras
    Object.keys(this.cameraManager.cameras).forEach(view => {
      const camera = this.cameraManager.cameras[view];
      const aspect = camera.userData.aspect || this.cameraManager.aspectRatio;
      console.log(`${view} camera aspect: ${aspect.toFixed(3)}`);
    });
  }

  /**
   * Create UI controls
   */
  createUI() {
    this.previewBtn = this.createElement('button', {
      id: 'export-preview-btn',
      textContent: '👁️ Preview OFF',
      style: `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        background: #757575;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        z-index: 1000;
        transition: background 0.3s;
      `
    });

    this.presetSelect = this.createElement('select', {
      id: 'export-preset-select',
      style: `
        position: fixed;
        bottom: 70px;
        right: 20px;
        padding: 5px;
        z-index: 1000;
        border-radius: 3px;
        border: 1px solid #ccc;
      `
    });

    Object.keys(this.cameraManager.exportPresets).forEach(preset => {
      const option = this.createElement('option', {
        value: preset,
        textContent: preset.replace(/_/g, ' ').toUpperCase(),
        selected: preset === this.currentExportPreset
      });
      this.presetSelect.appendChild(option);
    });

    this.addCSS();
  }

  bindEvents() {
    this.previewBtn.addEventListener('click', () => this.toggleExportPreview());
    this.presetSelect.addEventListener('change', (e) => this.changePreset(e.target.value));
  }

  toggleExportPreview() {
    if (this.exportPreviewActive) {
      this.disableExportPreview();
    } else {
      this.enableExportPreview();
    }
  }

  /**
   * FIXÉ: Force ratio 1920/1080 = 1.778
   */
  enableExportPreview() {
    this.exportPreviewActive = true;
    
    // FORCER le ratio 1920/1080
    const EXPORT_RATIO = 1920 / 1080; // = 1.777...
    
    console.log(`🎯 Forcing export ratio: ${EXPORT_RATIO.toFixed(3)}`);
    
    // 1. FORCER ratios CSS des viewports
    this.viewportRatioManager.setExportRatio(EXPORT_RATIO);
    
    // 2. FORCER caméras au même ratio
    this.cameraManager.enableExportPreview(this.currentExportPreset);
    this.cameraManager.forceUniformAspectRatio(EXPORT_RATIO);
    
    // 3. Sync exporter
    this.imageExporter.enableViewportSync(this.currentExportPreset);
    
    // 4. Update UI
    this.updateUI(true);
    this.showPreviewInfo();
    this.updateViewportIndicators();
    
    // 5. Debug après activation
    setTimeout(() => {
      this.debugViewports();
      if (this.app.renderAllViews) {
        this.app.renderAllViews();
      }
    }, 100);
    
    console.log(`🎯 Export Preview enabled with forced ratio: ${EXPORT_RATIO.toFixed(3)}`);
  }

  disableExportPreview() {
    this.exportPreviewActive = false;
    
    this.viewportRatioManager.removeFixedRatio();
    this.cameraManager.disableExportPreview();
    this.imageExporter.disableViewportSync();
    
    this.updateUI(false);
    this.hidePreviewInfo();
    this.clearViewportIndicators();
    
    setTimeout(() => {
      if (this.app.renderAllViews) {
        this.app.renderAllViews();
      }
    }, 50);
    
    console.log('👁️ Export Preview disabled');
  }

  changePreset(presetName) {
    this.currentExportPreset = presetName;
    
    if (this.exportPreviewActive) {
      // Toujours forcer 1920/1080 peu importe le preset
      const EXPORT_RATIO = 1920 / 1080;
      this.viewportRatioManager.setExportRatio(EXPORT_RATIO);
      this.enableExportPreview();
    }
  }

  updateUI(active) {
    this.previewBtn.textContent = active ? '🎯 Preview ON' : '👁️ Preview OFF';
    this.previewBtn.style.background = active ? '#4CAF50' : '#757575';
    this.presetSelect.style.opacity = active ? '1' : '0.7';
  }

  showPreviewInfo() {
    this.hidePreviewInfo();

    const preset = this.cameraManager.exportPresets[this.currentExportPreset];
    const cssRatio = this.viewportRatioManager.getCurrentRatio();
    const FORCED_RATIO = 1920 / 1080;
    
    this.infoPanel = this.createElement('div', {
      id: 'export-preview-info',
      style: `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 1001;
        max-width: 300px;
        backdrop-filter: blur(5px);
      `,
      innerHTML: `
        <div style="margin-bottom: 10px;">
          <strong>🎯 Export Preview Active</strong>
        </div>
        <div>Preset: <strong>${this.currentExportPreset}</strong></div>
        <div>Target: <strong>1920×1080</strong></div>
        <div>Forced Ratio: <strong>${FORCED_RATIO.toFixed(3)}:1</strong></div>
        <div>CSS Ratio: <strong>${cssRatio?.toFixed(3) || 'N/A'}:1</strong></div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444; font-size: 11px; opacity: 0.8;">
          All viewports forced to 1920/1080 ratio<br>
          <button onclick="window.exportPreview?.debugViewports()" style="background:#FF9800;color:white;border:none;padding:2px 4px;border-radius:2px;cursor:pointer;">Debug</button>
        </div>
      `
    });
    
    // Exposer pour debug
    window.exportPreview = this;
  }

  hidePreviewInfo() {
    if (this.infoPanel) {
      this.infoPanel.remove();
      this.infoPanel = null;
    }
  }

  updateViewportIndicators() {
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    viewNames.forEach(viewName => {
      const selectors = [
        `.viewport-${viewName}`,
        `[data-view="${viewName}"]`,
        `#${viewName}-view`,
        `#${viewName}-viewport`
      ];
      
      let container = null;
      for (const selector of selectors) {
        container = document.querySelector(selector);
        if (container) break;
      }
      
      if (container) {
        this.updateViewportIndicator(container, viewName);
      }
    });
  }

  updateViewportIndicator(container, viewName) {
    const existing = container.querySelector('.export-preview-overlay');
    if (existing) existing.remove();
    
    if (!this.exportPreviewActive) return;
    
    const overlay = this.createElement('div', {
      className: 'export-preview-overlay',
      style: `
        position: absolute;
        top: 5px;
        left: 5px;
        background: rgba(0, 255, 0, 0.9);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        pointer-events: none;
        z-index: 1000;
        animation: pulse 2s infinite;
      `
    });

    const isMatching = this.viewportRatioManager.isFixedRatioActive();
    
    overlay.textContent = isMatching ? '1920:1080 ✓' : 'ADAPTIVE';
    overlay.style.background = isMatching ? 
      'rgba(0, 255, 0, 0.9)' : 'rgba(255, 165, 0, 0.9)';
    
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    
    container.appendChild(overlay);
    
    container.classList.add('export-preview-active');
    if (!isMatching) {
      container.classList.add('aspect-mismatch');
    }
  }

  clearViewportIndicators() {
    document.querySelectorAll('.export-preview-overlay').forEach(el => el.remove());
    document.querySelectorAll('.export-preview-active').forEach(el => {
      el.classList.remove('export-preview-active', 'aspect-mismatch');
    });
  }

  async exportView(viewName, options = {}) {
    let result;
    
    if (this.exportPreviewActive) {
      result = await this.imageExporter.captureView(viewName, options);
    } else {
      result = await this.imageExporter.captureViewWithExactPreview(viewName, {
        preset: this.currentExportPreset,
        ...options
      });
    }
    
    this.downloadImage(result.imageData, result.filename);
    return result;
  }

  async exportAllViews(options = {}) {
    const results = [];
    const views = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    for (const viewName of views) {
      try {
        const result = await this.exportView(viewName, options);
        results.push(result);
        await this.delay(100);
      } catch (error) {
        console.error(`Export failed for ${viewName}:`, error);
        results.push({ viewName, error: error.message });
      }
    }
    
    return results;
  }

  downloadImage(dataUrl, filename) {
    const link = this.createElement('a', {
      download: filename,
      href: dataUrl,
      style: 'display: none;'
    });
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  addCSS() {
    const style = this.createElement('style', {
      textContent: `
        .export-preview-active {
          border: 2px solid #4CAF50 !important;
          box-shadow: 0 0 10px rgba(76, 175, 80, 0.5) !important;
        }
        
        .aspect-mismatch {
          border-color: #FF9800 !important;
          box-shadow: 0 0 10px rgba(255, 152, 0, 0.5) !important;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        #export-preview-btn:hover {
          transform: scale(1.05);
        }
        
        #export-preset-select:hover {
          border-color: #4CAF50;
        }
      `
    });
    
    document.head.appendChild(style);
  }

  createElement(tag, props = {}) {
    const element = document.createElement(tag);
    
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'style') {
        element.style.cssText = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else {
        element[key] = value;
      }
    });
    
    document.body.appendChild(element);
    return element;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      active: this.exportPreviewActive,
      preset: this.currentExportPreset,
      cssRatioFixed: this.viewportRatioManager.isFixedRatioActive(),
      cssRatio: this.viewportRatioManager.getCurrentRatio(),
      targetRatio: 1920 / 1080,
      syncInfo: this.imageExporter.getSyncInfo(),
      previewInfo: this.cameraManager.getExportPreviewInfo()
    };
  }

  destroy() {
    this.disableExportPreview();
    
    if (this.previewBtn) this.previewBtn.remove();
    if (this.presetSelect) this.presetSelect.remove();
    if (this.debugBtn) this.debugBtn.remove();
    this.hidePreviewInfo();
    this.clearViewportIndicators();
    
    console.log('🗑️ Export Preview Integration destroyed');
  }
}
