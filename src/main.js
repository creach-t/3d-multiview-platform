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
    
    // DOM elements
    this.container = null;
    this.viewports = {};
    this.canvases = {};
    
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
   * Initialize core 3D components
   */
  async initCore3D() {
    // Initialize scene
    this.scene = new Scene();
    
    // Initialize renderer with multiple viewports
    this.renderer = new Renderer(this.canvases);
    
    // Initialize camera manager for 6 orthographic views
    this.cameraManager = new CameraManager();
    
    // Initialize controls (synchronized across all views)
    this.controls = new Controls(this.cameraManager, this.renderer);
    
    // Initialize model loader
    this.modelLoader = new GLTFModelLoader(this.scene);
    
    // Setup lighting
    this.scene.setupLighting(this.settings.lighting);
    
    // Setup background
    this.scene.setupBackground(this.settings.background);
    
    // Start render loop
    this.startRenderLoop();
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
    
    // Batch processor for multiple exports
    this.batchProcessor = new BatchProcessor(this.imageExporter, this.templates);
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Export button
    document.getElementById('export-all').addEventListener('click', () => this.handleExportAll());
    
    // Control buttons
    document.getElementById('reset-camera').addEventListener('click', () => this.resetCamera());
    document.getElementById('center-model').addEventListener('click', () => this.centerModel());
    document.getElementById('auto-frame').addEventListener('click', () => this.autoFrame());
    
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
    document.getElementById('custom-color').addEventListener('change', (e) => {
      this.setCustomBackground(e.target.value);
    });
    
    // Marketplace and quality selectors
    document.getElementById('marketplace-preset').addEventListener('change', (e) => {
      this.setMarketplace(e.target.value);
    });
    
    document.getElementById('quality-preset').addEventListener('change', (e) => {
      this.setQuality(e.target.value);
    });
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
      document.getElementById('export-all').disabled = false;
      
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
   * Handle window resize
   */
  handleResize() {
    if (this.renderer) {
      this.renderer.handleResize();
    }
    if (this.cameraManager) {
      this.cameraManager.updateAspectRatios();
    }
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
      document.getElementById('quality-preset').value = template.recommendedQuality;
      this.setQuality(template.recommendedQuality);
    }
    
    // Update background if needed
    if (template.requiredBackground) {
      this.setBackground(template.requiredBackground);
    }
  }

  /**
   * Capture single view
   */
  async captureView(viewName) {
    try {
      const viewport = this.viewports[viewName];
      viewport.classList.add('capturing');
      
      const image = await this.imageExporter.captureView(viewName, this.settings);
      
      // Download the image
      this.downloadImage(image, `${viewName}_view.png`);
      
      viewport.classList.remove('capturing');
      this.showToast(`Vue ${viewName} capturée`, 'success');
      
    } catch (error) {
      console.error('Error capturing view:', error);
      this.showToast('Erreur lors de la capture', 'error');
    }
  }

  /**
   * Handle export all views
   */
  async handleExportAll() {
    if (!this.currentModel) {
      this.showToast('Aucun modèle chargé', 'warning');
      return;
    }
    
    try {
      this.showLoading('Export en cours...');
      
      const template = this.templates.getTemplate(this.settings.marketplace);
      const results = await this.batchProcessor.exportAll(this.settings, template);
      
      // Download all images as a ZIP
      await this.downloadBatch(results);
      
      this.hideLoading();
      this.showToast(`${results.length} vues exportées`, 'success');
      
    } catch (error) {
      this.hideLoading();
      console.error('Error exporting:', error);
      this.showToast('Erreur lors de l\'export', 'error');
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
    
    document.getElementById('poly-count').textContent = stats.triangles.toLocaleString();
    document.getElementById('vertex-count').textContent = stats.vertices.toLocaleString();
    document.getElementById('material-count').textContent = stats.materials;
    document.getElementById('texture-count').textContent = stats.textures;
  }

  /**
   * Download single image
   */
  downloadImage(imageData, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = imageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download batch of images as ZIP
   */
  async downloadBatch(results) {
    // This would require a ZIP library like JSZip
    // For now, download individually
    results.forEach((result, index) => {
      setTimeout(() => {
        this.downloadImage(result.data, result.filename);
      }, index * 100); // Stagger downloads
    });
  }

  /**
   * Show loading overlay
   */
  showLoading(message = 'Chargement...') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    
    text.textContent = message;
    overlay.classList.remove('hidden');
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hidden');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
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
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.multiViewPlatform = new MultiViewPlatform();
});

// Export for debugging
export default MultiViewPlatform;
