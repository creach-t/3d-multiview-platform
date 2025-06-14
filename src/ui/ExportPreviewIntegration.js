/**
 * ExportPreviewIntegration.js - UI Integration for Export Preview Mode
 * Adds export preview controls and synchronization to main application
 */

export class ExportPreviewIntegration {
  constructor(app, cameraManager, imageExporter) {
    this.app = app;
    this.cameraManager = cameraManager;
    this.imageExporter = imageExporter;
    
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
   * Enable export preview
   */
  enableExportPreview() {
    this.exportPreviewActive = true;
    
    // Sync camera and exporter
    this.cameraManager.enableExportPreview(this.currentExportPreset);
    this.imageExporter.enableViewportSync(this.currentExportPreset);
    
    // Update UI
    this.updateUI(true);
    this.showPreviewInfo();
    this.updateViewportIndicators();
    
    // Re-render views
    if (this.app.renderAllViews) {
      this.app.renderAllViews();
    }
    
    console.log(`🎯 Export Preview enabled: ${this.currentExportPreset}`);
  }

  /**
   * Disable export preview
   */
  disableExportPreview() {
    this.exportPreviewActive = false;
    
    this.cameraManager.disableExportPreview();
    this.imageExporter.disableViewportSync();
    
    this.updateUI(false);
    this.hidePreviewInfo();
    this.clearViewportIndicators();
    
    if (this.app.renderAllViews) {
      this.app.renderAllViews();
    }
    
    console.log('👁️ Export Preview disabled');
  }

  /**
   * Change export preset
   */
  changePreset(presetName) {
    this.currentExportPreset = presetName;
    
    if (this.exportPreviewActive) {
      this.enableExportPreview(); // Re-enable with new preset
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
   * Show preview info panel
   */
  showPreviewInfo() {
    this.hidePreviewInfo(); // Remove existing

    const preset = this.cameraManager.exportPresets[this.currentExportPreset];
    
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
        max-width: 250px;
        backdrop-filter: blur(5px);
      `,
      innerHTML: `
        <div style="margin-bottom: 10px;">
          <strong>🎯 Export Preview Active</strong>
        </div>
        <div>Preset: <strong>${this.currentExportPreset}</strong></div>
        <div>Resolution: <strong>${preset?.width}×${preset?.height}</strong></div>
        <div>Ratio: <strong>${preset?.aspect.toFixed(2)}:1</strong></div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444; font-size: 11px; opacity: 0.8;">
          Views show exactly what export will produce
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
   * Update viewport indicators
   */
  updateViewportIndicators() {
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    viewNames.forEach(viewName => {
      // Find canvas (adjust selector based on your DOM structure)
      const canvas = document.querySelector(`canvas[data-view="${viewName}"]`) ||
                   document.querySelector(`#${viewName}-canvas`) ||
                   this.app.renderer?.canvases?.[viewName];
      
      if (!canvas) return;
      
      const container = canvas.parentElement || canvas;
      this.updateViewportIndicator(container, viewName);
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

    // Check if view matches export
    const isMatching = this.imageExporter.isViewMatchingExport(viewName);
    
    overlay.textContent = isMatching ? 'EXPORT ✓' : 'CROP';
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
   * Get current status
   */
  getStatus() {
    return {
      active: this.exportPreviewActive,
      preset: this.currentExportPreset,
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

// Usage in main.js:
/*
import { ExportPreviewIntegration } from './ExportPreviewIntegration.js';

// In your main app initialization:
const exportPreview = new ExportPreviewIntegration(
  app, 
  cameraManager, 
  imageExporter
);

// Export methods are now available:
// exportPreview.exportView('front');
// exportPreview.exportAllViews();
*/
