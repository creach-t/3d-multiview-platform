/**
 * PreviewManager.js - Viewport Preview Management
 * Handles viewport states, overlays, and visual feedback
 */

export class PreviewManager {
  constructor(viewports) {
    this.viewports = viewports;
    this.viewStates = {};
    this.overlays = {};
    
    this.initializeViewports();
    this.setupEventListeners();
  }

  /**
   * Initialize viewport states and overlays
   */
  initializeViewports() {
    Object.entries(this.viewports).forEach(([viewName, viewport]) => {
      this.viewStates[viewName] = {
        isActive: false,
        isLoading: false,
        hasError: false,
        isCapturing: false,
        lastCaptureTime: null
      };
      
      this.createViewportOverlay(viewName, viewport);
      this.setupViewportInteractions(viewName, viewport);
    });
    
    console.log('👁️ Preview manager initialized for', Object.keys(this.viewports).length, 'viewports');
  }

  /**
   * Create overlay elements for viewport
   */
  createViewportOverlay(viewName, viewport) {
    // Camera indicator
    const cameraIndicator = document.createElement('div');
    cameraIndicator.className = 'camera-indicator';
    cameraIndicator.textContent = this.getViewDisplayName(viewName);
    viewport.appendChild(cameraIndicator);
    
    // Loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'viewport-overlay loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <span>Chargement...</span>
    `;
    viewport.appendChild(loadingOverlay);
    
    // Error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'viewport-overlay error-overlay';
    errorOverlay.innerHTML = `
      <div class="error-icon">❌</div>
      <span>Erreur de rendu</span>
    `;
    viewport.appendChild(errorOverlay);
    
    // Capture feedback overlay
    const captureOverlay = document.createElement('div');
    captureOverlay.className = 'viewport-overlay capture-overlay';
    captureOverlay.innerHTML = `
      <div class="capture-icon">📸</div>
      <span>Capture en cours...</span>
    `;
    viewport.appendChild(captureOverlay);
    
    this.overlays[viewName] = {
      camera: cameraIndicator,
      loading: loadingOverlay,
      error: errorOverlay,
      capture: captureOverlay
    };
  }

  /**
   * Setup viewport interaction handlers
   */
  setupViewportInteractions(viewName, viewport) {
    // Hover effects
    viewport.addEventListener('mouseenter', () => {
      this.setViewportActive(viewName, true);
    });
    
    viewport.addEventListener('mouseleave', () => {
      this.setViewportActive(viewName, false);
    });
    
    // Click effects
    viewport.addEventListener('click', () => {
      this.flashViewport(viewName);
    });
    
    // Double-click for fullscreen (if implemented)
    viewport.addEventListener('dblclick', () => {
      this.toggleViewportFullscreen(viewName);
    });
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Keyboard shortcuts for viewport navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      
      switch (e.code) {
        case 'Digit1':
          this.focusViewport('front');
          break;
        case 'Digit2':
          this.focusViewport('back');
          break;
        case 'Digit3':
          this.focusViewport('left');
          break;
        case 'Digit4':
          this.focusViewport('right');
          break;
        case 'Digit5':
          this.focusViewport('top');
          break;
        case 'Digit6':
          this.focusViewport('bottom');
          break;
      }
    });
  }

  /**
   * Get display name for view
   */
  getViewDisplayName(viewName) {
    const names = {
      front: 'Vue Avant',
      back: 'Vue Arrière',
      left: 'Vue Gauche',
      right: 'Vue Droite',
      top: 'Vue Dessus',
      bottom: 'Vue Dessous'
    };
    
    return names[viewName] || viewName;
  }

  /**
   * Set viewport active state
   */
  setViewportActive(viewName, active) {
    const viewport = this.viewports[viewName];
    const state = this.viewStates[viewName];
    
    if (!viewport || !state) return;
    
    state.isActive = active;
    viewport.classList.toggle('active', active);
    
    // Show/hide camera indicator
    const overlay = this.overlays[viewName];
    if (overlay && overlay.camera) {
      overlay.camera.style.opacity = active ? '1' : '0';
    }
  }

  /**
   * Set viewport loading state
   */
  setViewportLoading(viewName, loading, message = 'Chargement...') {
    const viewport = this.viewports[viewName];
    const state = this.viewStates[viewName];
    const overlay = this.overlays[viewName];
    
    if (!viewport || !state || !overlay) return;
    
    state.isLoading = loading;
    viewport.classList.toggle('loading', loading);
    
    if (overlay.loading) {
      overlay.loading.style.display = loading ? 'flex' : 'none';
      
      const textElement = overlay.loading.querySelector('span');
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }

  /**
   * Set viewport error state
   */
  setViewportError(viewName, hasError, message = 'Erreur de rendu') {
    const viewport = this.viewports[viewName];
    const state = this.viewStates[viewName];
    const overlay = this.overlays[viewName];
    
    if (!viewport || !state || !overlay) return;
    
    state.hasError = hasError;
    viewport.classList.toggle('error', hasError);
    
    if (overlay.error) {
      overlay.error.style.display = hasError ? 'flex' : 'none';
      
      const textElement = overlay.error.querySelector('span');
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }

  /**
   * Set viewport capture state
   */
  setViewportCapturing(viewName, capturing) {
    const viewport = this.viewports[viewName];
    const state = this.viewStates[viewName];
    const overlay = this.overlays[viewName];
    
    if (!viewport || !state || !overlay) return;
    
    state.isCapturing = capturing;
    viewport.classList.toggle('capturing', capturing);
    
    if (overlay.capture) {
      overlay.capture.style.display = capturing ? 'flex' : 'none';
    }
    
    if (capturing) {
      state.lastCaptureTime = Date.now();
      
      // Auto-hide after capture animation
      setTimeout(() => {
        this.setViewportCapturing(viewName, false);
      }, 1000);
    }
  }

  /**
   * Flash viewport for visual feedback
   */
  flashViewport(viewName) {
    const viewport = this.viewports[viewName];
    if (!viewport) return;
    
    viewport.classList.add('flash');
    
    setTimeout(() => {
      viewport.classList.remove('flash');
    }, 200);
  }

  /**
   * Focus on specific viewport
   */
  focusViewport(viewName) {
    const viewport = this.viewports[viewName];
    if (!viewport) return;
    
    // Remove focus from all viewports
    Object.values(this.viewports).forEach(vp => {
      vp.classList.remove('focused');
    });
    
    // Add focus to target viewport
    viewport.classList.add('focused');
    viewport.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove focus after delay
    setTimeout(() => {
      viewport.classList.remove('focused');
    }, 2000);
  }

  /**
   * Toggle viewport fullscreen mode
   */
  toggleViewportFullscreen(viewName) {
    const viewport = this.viewports[viewName];
    if (!viewport) return;
    
    const isFullscreen = viewport.classList.contains('fullscreen');
    
    // Remove fullscreen from all viewports
    Object.values(this.viewports).forEach(vp => {
      vp.classList.remove('fullscreen');
    });
    
    // Toggle fullscreen on target viewport
    if (!isFullscreen) {
      viewport.classList.add('fullscreen');
      
      // Add escape key listener
      const escapeHandler = (e) => {
        if (e.code === 'Escape') {
          viewport.classList.remove('fullscreen');
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      
      document.addEventListener('keydown', escapeHandler);
    }
  }

  /**
   * Update viewport thumbnails/previews
   */
  updateViewportThumbnail(viewName, imageData) {
    const viewport = this.viewports[viewName];
    if (!viewport) return;
    
    // Create or update thumbnail overlay
    let thumbnailOverlay = viewport.querySelector('.thumbnail-overlay');
    
    if (!thumbnailOverlay) {
      thumbnailOverlay = document.createElement('div');
      thumbnailOverlay.className = 'thumbnail-overlay';
      viewport.appendChild(thumbnailOverlay);
    }
    
    // Set thumbnail image
    thumbnailOverlay.style.backgroundImage = `url(${imageData})`;
    thumbnailOverlay.style.backgroundSize = 'cover';
    thumbnailOverlay.style.backgroundPosition = 'center';
    
    // Show thumbnail briefly
    thumbnailOverlay.style.opacity = '0.8';
    
    setTimeout(() => {
      thumbnailOverlay.style.opacity = '0';
    }, 2000);
  }

  /**
   * Show viewport grid overlay
   */
  showGrid(viewName, enabled = true) {
    const viewport = this.viewports[viewName];
    if (!viewport) return;
    
    viewport.classList.toggle('show-grid', enabled);
  }

  /**
   * Set viewport export preview mode
   */
  setExportPreview(viewName, enabled) {
    const viewport = this.viewports[viewName];
    if (!viewport) return;
    
    viewport.classList.toggle('export-preview', enabled);
  }

  /**
   * Batch update all viewports
   */
  batchUpdateViewports(updates) {
    Object.entries(updates).forEach(([viewName, update]) => {
      if (update.loading !== undefined) {
        this.setViewportLoading(viewName, update.loading, update.loadingMessage);
      }
      
      if (update.error !== undefined) {
        this.setViewportError(viewName, update.error, update.errorMessage);
      }
      
      if (update.capturing !== undefined) {
        this.setViewportCapturing(viewName, update.capturing);
      }
      
      if (update.active !== undefined) {
        this.setViewportActive(viewName, update.active);
      }
    });
  }

  /**
   * Get viewport state
   */
  getViewportState(viewName) {
    return this.viewStates[viewName] ? { ...this.viewStates[viewName] } : null;
  }

  /**
   * Get all viewport states
   */
  getAllViewportStates() {
    const states = {};
    Object.keys(this.viewStates).forEach(viewName => {
      states[viewName] = { ...this.viewStates[viewName] };
    });
    return states;
  }

  /**
   * Reset all viewports to default state
   */
  resetAllViewports() {
    Object.keys(this.viewports).forEach(viewName => {
      this.setViewportLoading(viewName, false);
      this.setViewportError(viewName, false);
      this.setViewportCapturing(viewName, false);
      this.setViewportActive(viewName, false);
      this.setExportPreview(viewName, false);
      this.showGrid(viewName, false);
      
      const viewport = this.viewports[viewName];
      viewport.classList.remove('fullscreen', 'focused', 'flash');
    });
  }

  /**
   * Create viewport performance monitor
   */
  createPerformanceMonitor(viewName) {
    const viewport = this.viewports[viewName];
    if (!viewport) return;
    
    const monitor = document.createElement('div');
    monitor.className = 'performance-monitor';
    monitor.innerHTML = `
      <div class="fps-counter">FPS: <span class="fps-value">0</span></div>
      <div class="render-time">Render: <span class="render-time-value">0ms</span></div>
    `;
    
    viewport.appendChild(monitor);
    
    return monitor;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(viewName, metrics) {
    const viewport = this.viewports[viewName];
    const monitor = viewport?.querySelector('.performance-monitor');
    
    if (!monitor) return;
    
    const fpsValue = monitor.querySelector('.fps-value');
    const renderTimeValue = monitor.querySelector('.render-time-value');
    
    if (fpsValue && metrics.fps !== undefined) {
      fpsValue.textContent = Math.round(metrics.fps);
    }
    
    if (renderTimeValue && metrics.renderTime !== undefined) {
      renderTimeValue.textContent = Math.round(metrics.renderTime) + 'ms';
    }
  }

  /**
   * Create viewport comparison mode
   */
  enableComparisonMode(viewName1, viewName2) {
    const viewport1 = this.viewports[viewName1];
    const viewport2 = this.viewports[viewName2];
    
    if (!viewport1 || !viewport2) return;
    
    // Add comparison styling
    viewport1.classList.add('comparison-active', 'comparison-left');
    viewport2.classList.add('comparison-active', 'comparison-right');
    
    // Create comparison overlay
    const overlay = document.createElement('div');
    overlay.className = 'comparison-overlay';
    overlay.innerHTML = `
      <div class="comparison-label">
        ${this.getViewDisplayName(viewName1)} vs ${this.getViewDisplayName(viewName2)}
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-disable after delay
    setTimeout(() => {
      this.disableComparisonMode();
    }, 5000);
  }

  /**
   * Disable comparison mode
   */
  disableComparisonMode() {
    Object.values(this.viewports).forEach(viewport => {
      viewport.classList.remove('comparison-active', 'comparison-left', 'comparison-right');
    });
    
    const overlay = document.querySelector('.comparison-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Dispose of preview manager
   */
  dispose() {
    // Remove all overlays
    Object.values(this.overlays).forEach(overlaySet => {
      Object.values(overlaySet).forEach(overlay => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });
    });
    
    // Reset viewport classes
    Object.values(this.viewports).forEach(viewport => {
      viewport.className = viewport.className
        .split(' ')
        .filter(cls => !cls.startsWith('viewport-') && !['active', 'loading', 'error', 'capturing', 'fullscreen', 'focused', 'flash', 'show-grid', 'export-preview'].includes(cls))
        .join(' ');
    });
    
    // Remove comparison overlays
    this.disableComparisonMode();
    
    console.log('🗑️ Preview manager disposed');
  }
}
