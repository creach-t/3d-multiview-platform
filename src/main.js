/**
 * 3D Multi-View Platform - Main Application Entry Point
 * Optimized for TurboSquid and CGTrader exports
 */

import { Scene } from './core/Scene.js';
import { Renderer } from './core/Renderer.js';
import { CameraManager } from './core/CameraManager.js';
import { Controls } from './core/Controls.js';
import { GLTFModelLoader } from './loaders/GLTFLoader.js';
import { FileUploader } from './ui/FileUploader.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { PreviewManager } from './ui/PreviewManager.js';
import { ImageExporter } from './export/ImageExporter.js';
import { Templates } from './export/Templates.js';
import { BatchProcessor } from './export/BatchProcessor.js';
// AJOUT: Import ExportPreviewIntegration
import { ExportPreviewIntegration } from './ui/ExportPreviewIntegration.js';

/**
 * Main Application Class
 */
class MultiViewPlatform {
  constructor() {
    this.isInitialized = false;
    this.currentModel = null;
    this.settings = {
      lighting: 'studio',
      background: 'turbosquid',
      quality: 'standard',
      marketplace: 'turbosquid'
    };
    
    // Core components
    this.scene = null;
    this.renderer = null;
    this.cameraManager = null;
    this.controls = null;
    this.modelLoader = null;
    
    // UI components
    this.fileUploader = null;
    this.controlPanel = null;
    this.previewManager = null;
    
    // Export components
    this.imageExporter = null;
    this.templates = null;
    this.batchProcessor = null;
    // AJOUT: Export preview integration
    this.exportPreview = null;
    
    // DOM elements
    this.container = null;
    this.viewports = {};
    this.canvases = {};
    
    // State tracking
    this.captureStates = new Set(); // Track which viewports are capturing
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing 3D Multi-View Platform...');
      
      // Setup DOM references
      this.setupDOMReferences();
      
      // Initialize core 3D components
      await this.initCore3D();
      
      // Initialize UI components
      this.initUI();
      
      // Initialize export system
      this.initExportSystem();
      
      // AJOUT: Initialize export preview APRÈS initExportSystem
      this.initExportPreview();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('✅ Platform initialized successfully');
      this.showToast('Platform prête à l\'usage', 'success');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.showToast('Erreur d\'initialisation', 'error');
    }
  }

  /**
   * Setup DOM element references
   */
  setupDOMReferences() {
    this.container = document.querySelector('.viewport-container');
    
    // Get all viewport canvases
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    viewNames.forEach(view => {
      this.canvases[view] = document.getElementById(`canvas-${view}`);
      this.viewports[view] = this.canvases[view].parentElement;
    });
    
    // Verify all elements exist
    if (!this.container || Object.values(this.canvases).some(canvas => !canvas)) {
      throw new Error('Required DOM elements not found');
    }
  }

  /**
   * Initialize core 3D components with proper aspect ratio handling
   */
  async initCore3D() {
    // Initialize scene
    this.scene = new Scene();
    
    // Initialize renderer with multiple viewports
    this.renderer = new Renderer(this.canvases);
    
    // Initialize camera manager for 6 orthographic views
    this.cameraManager = new CameraManager();
    
    // IMPORTANT: Connect renderer to camera manager for aspect ratio sync
    this.renderer.setCameraManager(this.cameraManager);
    
    // Initialize controls (synchronized across all views)
    this.controls = new Controls(this.cameraManager, this.renderer);
    
    // Initialize model loader
    this.modelLoader = new GLTFModelLoader(this.scene);
    
    // Setup lighting
    this.scene.setupLighting(this.settings.lighting);
    
    // Setup background
    this.scene.setupBackground(this.settings.background);
    
    // Initial aspect ratio update
    this.updateAspectRatios();
    
    // Start render loop
    this.startRenderLoop();
    
    console.log('📐 Core 3D components initialized with aspect ratio synchronization');
  }

  /**
   * Update aspect ratios for all viewports
   */
  updateAspectRatios() {
    const viewportSizes = {};
    
    Object.entries(this.viewports).forEach(([viewName, viewport]) => {
      const rect = viewport.getBoundingClientRect();
      
      // Get the actual canvas area (excluding header)
      const header = viewport.querySelector('.viewport-header');
      const headerHeight = header ? header.offsetHeight : 0;
      
      const canvasHeight = rect.height - headerHeight;
      const canvasWidth = rect.width;
      
      viewportSizes[viewName] = {
        width: canvasWidth,
        height: canvasHeight
      };
      
      console.log(`📏 ${viewName}: ${canvasWidth}x${canvasHeight} (ratio: ${(canvasWidth/canvasHeight).toFixed(2)})`);
    });
    
    // Update camera manager with new aspect ratios
    if (this.cameraManager) {
      this.cameraManager.updateAspectRatios(viewportSizes);
    }
    
    // Update renderer sizes
    if (this.renderer) {
      this.renderer.updateAllSizes();
    }
  }

  /**
   * Initialize UI components
   */
  initUI() {
    // File uploader with drag & drop
    this.fileUploader = new FileUploader({
      onFileSelected: (file) => this.handleFileUpload(file),
      onError: (error) => this.showToast(error, 'error')
    });
    
    // Control panel
    this.controlPanel = new ControlPanel({
      onSettingChange: (setting, value) => this.handleSettingChange(setting, value),
      onAction: (action) => this.handleControlAction(action)
    });
    
    // Preview manager
    this.previewManager = new PreviewManager(this.viewports);
  }

  /**
   * Initialize export system
   */
  initExportSystem() {
    // Templates for different marketplaces
    this.templates = new Templates();
    
    // Image exporter
    this.imageExporter = new ImageExporter(this.renderer, this.cameraManager);
    
    // Connect scene to image exporter
    this.imageExporter.setScene(this.scene);
    
    // Batch processor for multiple exports
    this.batchProcessor = new BatchProcessor(this.imageExporter, this.templates);
    
    // Setup progress callbacks
    this.batchProcessor.onProgress((data) => {
      console.log('Export progress:', data);
      // You can update UI progress here
    });
    
    this.batchProcessor.onError((data) => {
      console.error('Export error:', data);
      this.showToast(`Erreur export ${data.viewName}: ${data.error}`, 'error');
    });
  }

  /**
   * AJOUT: Initialize export preview system
   */
  initExportPreview() {
    // Initialize export preview integration
    this.exportPreview = new ExportPreviewIntegration(
      this,              // app instance
      this.cameraManager,
      this.imageExporter
    );
    
    console.log('🎯 Export Preview Integration initialized');
  }

  /**
   * AJOUT: Method pour render all views (requis par ExportPreviewIntegration)
   */
  renderAllViews() {
    if (this.renderer && this.cameraManager && this.scene) {
      ['front', 'back', 'left', 'right', 'top', 'bottom'].forEach(viewName => {
        const camera = this.cameraManager.getCamera(viewName);
        if (camera) {
          this.renderer.renderSingle(viewName, this.scene, camera);
        }
      });
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Window resize with aspect ratio update
    window.addEventListener('resize', () => this.handleResize());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Export button
    const exportBtn = document.getElementById('export-all');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportAll());
    }
    
    // Control buttons
    const resetBtn = document.getElementById('reset-camera');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetCamera());
    }
    
    const centerBtn = document.getElementById('center-model');
    if (centerBtn) {
      centerBtn.addEventListener('click', () => this.centerModel());
    }
    
    const autoFrameBtn = document.getElementById('auto-frame');
    if (autoFrameBtn) {
      autoFrameBtn.addEventListener('click', () => this.autoFrame());
    }
    
    // Individual capture buttons
    document.querySelectorAll('.capture-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.getAttribute('data-view');
        this.captureView(view);
      });
    });
    
    // Setting controls
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.getAttribute('data-preset');
        this.setLightingPreset(preset);
      });
    });
    
    document.querySelectorAll('.bg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const background = e.target.getAttribute('data-background');
        this.setBackground(background);
      });
    });
    
    // Color picker
    const colorPicker = document.getElementById('custom-color');
    if (colorPicker) {
      colorPicker.addEventListener('change', (e) => {
        this.setCustomBackground(e.target.value);
      });
    }
    
    // Marketplace and quality selectors
    const marketplaceSelect = document.getElementById('marketplace-preset');
    if (marketplaceSelect) {
      marketplaceSelect.addEventListener('change', (e) => {
        this.setMarketplace(e.target.value);
      });
    }
    
    const qualitySelect = document.getElementById('quality-preset');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', (e) => {
        this.setQuality(e.target.value);
      });
    }
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(file) {
    try {
      this.showLoading('Chargement du modèle...');
      
      // Load the model
      const model = await this.modelLoader.load(file);
      
      // Store current model reference
      this.currentModel = model;
      
      // Auto-frame the model
      this.autoFrame();
      
      // Update model info display
      this.updateModelInfo(model);
      
      // Enable export button
      const exportBtn = document.getElementById('export-all');
      if (exportBtn) {
        exportBtn.disabled = false;
      }
      
      this.hideLoading();
      this.showToast('Modèle chargé avec succès', 'success');
      
    } catch (error) {
      this.hideLoading();
      console.error('Error loading model:', error);
      this.showToast('Erreur lors du chargement', 'error');
    }
  }

  /**
   * Handle setting changes
   */
  handleSettingChange(setting, value) {
    this.settings[setting] = value;
    
    switch (setting) {
      case 'lighting':
        this.scene.setupLighting(value);
        break;
      case 'background':
        this.scene.setupBackground(value);
        break;
      case 'quality':
        this.renderer.setQuality(value);
        break;
      case 'marketplace':
        this.updateExportSettings(value);
        break;
    }
  }

  /**
   * Handle control actions
   */
  handleControlAction(action) {
    switch (action) {
      case 'reset':
        this.resetCamera();
        break;
      case 'center':
        this.centerModel();
        break;
      case 'autoframe':
        this.autoFrame();
        break;
      case 'export':
        this.handleExportAll();
        break;
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(event) {
    if (!this.isInitialized) return;
    
    // Don't interfere with form inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
    
    switch (event.code) {
      case 'KeyR':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.resetCamera();
        }
        break;
      case 'KeyC':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.centerModel();
        }
        break;
      case 'KeyE':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.handleExportAll();
        }
        break;
      case 'KeyF':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.autoFrame();
        }
        break;
      case 'Space':
        event.preventDefault();
        this.toggleAutoRotation();
        break;
    }
  }

  /**
   * Handle window resize with aspect ratio updates
   */
  handleResize() {
    console.log('🔄 Handling resize with aspect ratio update...');
    
    // Update renderer sizes first
    if (this.renderer) {
      this.renderer.handleResize();
    }
    
    // Then update aspect ratios
    setTimeout(() => {
      this.updateAspectRatios();
    }, 100);
  }

  /**
   * Start the render loop
   */
  startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (this.controls) {
        this.controls.update();
      }
      
      if (this.renderer && this.scene && this.cameraManager) {
        this.renderer.render(this.scene, this.cameraManager.cameras);
      }
    };
    
    animate();
  }

  /**
   * Reset camera to default positions
   */
  resetCamera() {
    if (this.cameraManager) {
      this.cameraManager.reset();
      this.showToast('Caméra réinitialisée', 'success');
    }
  }

  /**
   * Center model in all views
   */
  centerModel() {
    if (this.currentModel && this.scene) {
      this.scene.centerModel(this.currentModel);
      this.showToast('Modèle centré', 'success');
    }
  }

  /**
   * Auto-frame model in all views
   */
  autoFrame() {
    if (this.currentModel && this.cameraManager) {
      this.cameraManager.frameModel(this.currentModel);
      this.showToast('Cadrage automatique appliqué', 'success');
    }
  }

  /**
   * Set lighting preset
   */
  setLightingPreset(preset) {
    this.settings.lighting = preset;
    this.scene.setupLighting(preset);
    
    // Update UI
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === preset);
    });
    
    this.showToast(`Éclairage: ${preset}`, 'success');
  }

  /**
   * Set background
   */
  setBackground(background) {
    this.settings.background = background;
    this.scene.setupBackground(background);
    
    // Update UI
    document.querySelectorAll('.bg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-background') === background);
    });
    
    this.showToast(`Arrière-plan: ${background}`, 'success');
  }

  /**
   * Set custom background color
   */
  setCustomBackground(color) {
    this.scene.setupBackground('custom', color);
    this.showToast(`Couleur personnalisée: ${color}`, 'success');
  }

  /**
   * Set marketplace preset
   */
  setMarketplace(marketplace) {
    this.settings.marketplace = marketplace;
    this.updateExportSettings(marketplace);
    this.showToast(`Marketplace: ${marketplace}`, 'success');
  }

  /**
   * Set quality preset
   */
  setQuality(quality) {
    this.settings.quality = quality;
    this.renderer.setQuality(quality);
    this.showToast(`Qualité: ${quality}`, 'success');
  }

  /**
   * Update export settings based on marketplace
   */
  updateExportSettings(marketplace) {
    const template = this.templates.getTemplate(marketplace);
    
    // Update quality selector if needed
    if (template.recommendedQuality) {
      const qualitySelect = document.getElementById('quality-preset');
      if (qualitySelect) {
        qualitySelect.value = template.recommendedQuality;
        this.setQuality(template.recommendedQuality);
      }
    }
    
    // Update background if needed
    if (template.requiredBackground) {
      this.setBackground(template.requiredBackground);
    }
  }

  /**
   * Capture single view with correct aspect ratio
   */
  async captureView(viewName) {
    if (!this.currentModel) {
      this.showToast('Aucun modèle chargé', 'warning');
      return;
    }

    // Prevent multiple simultaneous captures of same view
    if (this.captureStates.has(viewName)) {
      console.log(`Already capturing ${viewName}, skipping...`);
      return;
    }

    this.captureStates.add(viewName);
    const viewport = this.viewports[viewName];

    try {
      if (viewport) {
        viewport.classList.add('capturing');
      }
      
      // Get viewport dimensions for correct aspect ratio
      const canvasSize = this.renderer.getCanvasSize(viewName);
      const exportSettings = {
        ...this.settings,
        resolution: canvasSize ? {
          width: Math.floor(canvasSize.width * 2), // 2x for quality
          height: Math.floor(canvasSize.height * 2)
        } : undefined
      };
      
      const result = await this.imageExporter.captureView(viewName, exportSettings);
      
      // Download the image
      this.downloadImage(result.imageData, result.filename || `${viewName}_view.png`);
      
      this.showToast(`Vue ${viewName} capturée`, 'success');
      
    } catch (error) {
      console.error('Error capturing view:', error);
      this.showToast('Erreur lors de la capture', 'error');
    } finally {
      // Always cleanup
      this.captureStates.delete(viewName);
      if (viewport) {
        viewport.classList.remove('capturing');
      }
    }
  }

  /**
   * Handle export all views with correct aspect ratios
   */
  async handleExportAll() {
    if (!this.currentModel) {
      this.showToast('Aucun modèle chargé', 'warning');
      return;
    }
    
    // Check if already processing
    if (this.batchProcessor.isProcessing) {
      this.showToast('Export déjà en cours...', 'warning');
      return;
    }
    
    try {
      this.showLoading('Export en cours...');
      
      // Get template
      const template = this.templates.getTemplate(this.settings.marketplace);
      
      // Prepare export settings with proper aspect ratios
      const exportSettings = {
        ...this.settings,
        canvasSizes: this.renderer.getAllCanvasSizes()
      };
      
      // Export all views
      const results = await this.batchProcessor.exportAll(exportSettings, template);
      
      this.hideLoading();
      
      // Validate results
      if (!Array.isArray(results)) {
        throw new Error('Invalid results format from batch processor');
      }
      
      if (results.length === 0) {
        throw new Error('No results returned from export');
      }
      
      // Download all images
      await this.downloadBatch(results);
      
      const successCount = results.filter(r => r && r.success).length;
      const totalCount = results.length;
      
      if (successCount > 0) {
        this.showToast(`${successCount}/${totalCount} vues exportées`, 'success');
      } else {
        this.showToast('Aucune vue exportée avec succès', 'error');
      }
      
    } catch (error) {
      this.hideLoading();
      console.error('Error exporting:', error);
      this.showToast(`Erreur export: ${error.message}`, 'error');
    }
  }

  /**
   * Toggle auto rotation
   */
  toggleAutoRotation() {
    if (this.controls) {
      this.controls.toggleAutoRotation();
    }
  }

  /**
   * Update model information display
   */
  updateModelInfo(model) {
    const stats = this.scene.getModelStats(model);
    
    const polyCount = document.getElementById('poly-count');
    const vertexCount = document.getElementById('vertex-count');
    const materialCount = document.getElementById('material-count');
    const textureCount = document.getElementById('texture-count');
    
    if (polyCount) polyCount.textContent = stats.triangles.toLocaleString();
    if (vertexCount) vertexCount.textContent = stats.vertices.toLocaleString();
    if (materialCount) materialCount.textContent = stats.materials;
    if (textureCount) textureCount.textContent = stats.textures;
  }

  /**
   * Download single image
   */
  downloadImage(imageData, filename) {
    if (!imageData || typeof imageData !== 'string') {
      console.error('Invalid image data for download');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = imageData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
      this.showToast('Erreur lors du téléchargement', 'error');
    }
  }

  /**
   * Download batch of images
   */
  async downloadBatch(results) {
    if (!Array.isArray(results)) {
      console.error('Results is not an array:', results);
      this.showToast('Format de résultats invalide', 'error');
      return;
    }
    
    if (results.length === 0) {
      console.warn('No results to download');
      this.showToast('Aucun résultat à télécharger', 'warning');
      return;
    }
    
    // Filter successful results with valid data
    const successfulResults = results.filter(result => 
      result && 
      result.success && 
      result.data && 
      typeof result.data === 'string' &&
      result.filename
    );
    
    if (successfulResults.length === 0) {
      console.warn('No successful results with valid data');
      this.showToast('Aucun fichier valide à télécharger', 'warning');
      return;
    }
    
    console.log(`Downloading ${successfulResults.length} files...`);
    
    // Download each successful result with staggered timing
    successfulResults.forEach((result, index) => {
      setTimeout(() => {
        try {
          this.downloadImage(result.data, result.filename);
        } catch (error) {
          console.error(`Error downloading ${result.filename}:`, error);
        }
      }, index * 200); // 200ms delay between downloads
    });
    
    this.showToast(`Téléchargement de ${successfulResults.length} fichiers...`, 'info');
  }

  /**
   * Show loading overlay
   */
  showLoading(message = 'Chargement...') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    
    if (text) text.textContent = message;
    if (overlay) overlay.classList.remove('hidden');
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${this.getToastIcon(type)}</span>
      <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * Get icon for toast type
   */
  getToastIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * Cleanup and dispose resources
   */
  dispose() {
    if (this.exportPreview) {
      this.exportPreview.destroy();
    }
    if (this.batchProcessor) {
      this.batchProcessor.dispose();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.multiViewPlatform = new MultiViewPlatform();
});

// Export for debugging
export default MultiViewPlatform;
