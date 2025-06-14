/**
 * ExportPreviewIntegration.js - UI Integration for Export Preview Mode
 * UPDATED: Intègre ViewportRatioManager pour ratios CSS fixes
 */

import { ViewportRatioManager } from './ViewportRatioManager.js';

export class ExportPreviewIntegration {
  constructor(app, cameraManager, imageExporter) {
    this.app = app;
    this.cameraManager = cameraManager;
    this.imageExporter = imageExporter;
    
    // AJOUT: Gestionnaire des ratios CSS
    this.viewportRatioManager = new ViewportRatioManager();
    
    this.exportPreviewActive = false;
    this.currentExportPreset = 'turbosquid_product';
    
    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
    console.log('🎯 Export Preview Integration initialized');
  }

  /**
   * Create UI controls
   */
  createUI() {
    // Main toggle button
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

    // Preset selector
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

    // Populate presets
    Object.keys(this.cameraManager.exportPresets).forEach(preset => {
      const option = this.createElement('option', {
        value: preset,
        textContent: preset.replace(/_/g, ' ').toUpperCase(),
        selected: preset === this.currentExportPreset
      });
      this.presetSelect.appendChild(option);
    });

    // Add CSS
    this.addCSS();
  }

  /**
   * Bind events
   */
  bindEvents() {
    this.previewBtn.addEventListener('click', () => this.toggleExportPreview());
    this.presetSelect.addEventListener('change', (e) => this.changePreset(e.target.value));
  }

  /**
   * Toggle export preview mode
   */
  toggleExportPreview() {
    if (this.exportPreviewActive) {
      this.disableExportPreview();
    } else {
      this.enableExportPreview();
    }
  }

  /**
   * MODIFIÉ: Active export preview avec ratios CSS
   */
  enableExportPreview() {
    this.exportPreviewActive = true;
    
    const preset = this.cameraManager.exportPresets[this.currentExportPreset];
    if (!preset) return;
    
    // 1. FORCER les ratios CSS des viewports
    this.viewportRatioManager.setExportRatio(preset.aspect);
    
    // 2. Sync caméras avec export
    this.cameraManager.enableExportPreview(this.currentExportPreset);
    this.imageExporter.enableViewportSync(this.currentExportPreset);
    
    // 3. Update UI
    this.updateUI(true);
    this.showPreviewInfo();
    this.updateViewportIndicators();
    
    // 4. Re-render après changement CSS
    setTimeout(() => {
      if (this.app.renderAllViews) {
        this.app.renderAllViews();
      }
    }, 50); // Délai pour que CSS s'applique
    
    console.log(`🎯 Export Preview enabled: ${this.currentExportPreset} (${preset.aspect.toFixed(2)}:1)`);
  }

  /**
   * MODIFIÉ: Désactive avec restauration CSS
   */
  disableExportPreview() {
    this.exportPreviewActive = false;
    
    // 1. RESTAURER ratios CSS responsives
    this.viewportRatioManager.removeFixedRatio();
    
    // 2. Désync caméras
    this.cameraManager.disableExportPreview();
    this.imageExporter.disableViewportSync();
    
    // 3. Update UI
    this.updateUI(false);
    this.hidePreviewInfo();
    this.clearViewportIndicators();
    
    // 4. Re-render après changement CSS
    setTimeout(() => {
      if (this.app.renderAllViews) {
        this.app.renderAllViews();
      }
    }, 50);
    
    console.log('👁️ Export Preview disabled - viewports responsive');
  }

  /**
   * MODIFIÉ: Change preset avec nouveau ratio CSS
   */
  changePreset(presetName) {
    this.currentExportPreset = presetName;
    
    if (this.exportPreviewActive) {
      const preset = this.cameraManager.exportPresets[presetName];
      if (preset) {
        // Mettre à jour le ratio CSS immédiatement
        this.viewportRatioManager.setExportRatio(preset.aspect);
        
        // Puis réactiver avec nouveau preset
        this.enableExportPreview();
      }
    }
  }

  /**
   * Update UI state
   */
  updateUI(active) {
    this.previewBtn.textContent = active ? '🎯 Preview ON' : '👁️ Preview OFF';
    this.previewBtn.style.background = active ? '#4CAF50' : '#757575';
    this.presetSelect.style.opacity = active ? '1' : '0.7';
  }

  /**
   * MODIFIÉ: Show preview info avec ratio CSS
   */
  showPreviewInfo() {
    this.hidePreviewInfo();

    const preset = this.cameraManager.exportPresets[this.currentExportPreset];
    const cssRatio = this.viewportRatioManager.getCurrentRatio();
    
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
        max-width: 280px;
        backdrop-filter: blur(5px);
      `,
      innerHTML: `
        <div style="margin-bottom: 10px;">
          <strong>🎯 Export Preview Active</strong>
        </div>
        <div>Preset: <strong>${this.currentExportPreset}</strong></div>
        <div>Resolution: <strong>${preset?.width}×${preset?.height}</strong></div>
        <div>CSS Ratio: <strong>${cssRatio?.toFixed(3) || 'N/A'}:1</strong></div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444; font-size: 11px; opacity: 0.8;">
          Viewports fixés au ratio d'export<br>
          Canvas adaptés automatiquement
        </div>
      `
    });
  }

  /**
   * Hide preview info panel
   */
  hidePreviewInfo() {
    if (this.infoPanel) {
      this.infoPanel.remove();
      this.infoPanel = null;
    }
  }

  /**
   * MODIFIÉ: Update viewport indicators avec vérification CSS
   */
  updateViewportIndicators() {
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    viewNames.forEach(viewName => {
      // Chercher viewports avec sélecteurs multiples
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

  /**
   * Update single viewport indicator
   */
  updateViewportIndicator(container, viewName) {
    // Remove existing
    const existing = container.querySelector('.export-preview-overlay');
    if (existing) existing.remove();
    
    if (!this.exportPreviewActive) return;
    
    // Add indicator
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

    // En mode ratio fixe CSS, toujours "matched"
    const isMatching = this.viewportRatioManager.isFixedRatioActive();
    
    overlay.textContent = isMatching ? 'RATIO ✓' : 'ADAPTIVE';
    overlay.style.background = isMatching ? 
      'rgba(0, 255, 0, 0.9)' : 'rgba(255, 165, 0, 0.9)';
    
    // Ensure container positioning
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    
    container.appendChild(overlay);
    
    // Add border highlighting
    container.classList.add('export-preview-active');
    if (!isMatching) {
      container.classList.add('aspect-mismatch');
    }
  }

  /**
   * Clear viewport indicators
   */
  clearViewportIndicators() {
    document.querySelectorAll('.export-preview-overlay').forEach(el => el.remove());
    document.querySelectorAll('.export-preview-active').forEach(el => {
      el.classList.remove('export-preview-active', 'aspect-mismatch');
    });
  }

  /**
   * Export current view with sync guarantee
   */
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

  /**
   * Export all views
   */
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

  /**
   * Download image helper
   */
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

  /**
   * Add required CSS
   */
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

  /**
   * Helper to create elements
   */
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

  /**
   * Utility delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * MODIFIÉ: Get current status avec ratio CSS
   */
  getStatus() {
    return {
      active: this.exportPreviewActive,
      preset: this.currentExportPreset,
      cssRatioFixed: this.viewportRatioManager.isFixedRatioActive(),
      cssRatio: this.viewportRatioManager.getCurrentRatio(),
      syncInfo: this.imageExporter.getSyncInfo(),
      previewInfo: this.cameraManager.getExportPreviewInfo()
    };
  }

  /**
   * Destroy integration
   */
  destroy() {
    this.disableExportPreview();
    
    if (this.previewBtn) this.previewBtn.remove();
    if (this.presetSelect) this.presetSelect.remove();
    this.hidePreviewInfo();
    this.clearViewportIndicators();
    
    console.log('🗑️ Export Preview Integration destroyed');
  }
}
