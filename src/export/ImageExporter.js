/**
 * ImageExporter.js - High-Resolution Image Export System
 * Handles capturing and exporting viewport images with correct aspect ratios
 * ADDED: Viewport sync for export preview coordination
 */

import * as THREE from 'three';

export class ImageExporter {
  constructor(renderer, cameraManager) {
    this.renderer = renderer;
    this.cameraManager = cameraManager;
    this.scene = null; // Will be set from outside
    
    // ADDED: Viewport synchronization
    this.syncWithViewport = true;
    this.previewMode = false;
    
    // Export settings
    this.exportSettings = {
      format: 'image/png',
      quality: 0.95,
      antialias: true,
      preserveDrawingBuffer: true
    };
    
    // Resolution presets with correct aspect ratios
    this.resolutionPresets = {
      turbosquid_search: { width: 1920, height: 1920 }, // Square for search images
      turbosquid_product: { width: 1920, height: 1080 }, // 16:9 for product shots
      cgtrader_main: { width: 1920, height: 1440 }, // 4:3 ratio
      square: { width: 2048, height: 2048 }, // Perfect square
      ultra_hd: { width: 3840, height: 2160 }, // 4K 16:9
      print_ready: { width: 7680, height: 4320 } // 8K for print
    };
    
    // Background presets
    this.backgroundPresets = {
      turbosquid: new THREE.Color(0xf7f7f7),
      white: new THREE.Color(0xffffff),
      black: new THREE.Color(0x000000),
      transparent: null,
      gradient: null // Will be generated
    };
    
    this.isExporting = false;
  }

  /**
   * Set the scene reference
   */
  setScene(scene) {
    this.scene = scene;
  }

  /**
   * ADDED: Enable viewport synchronization
   */
  enableViewportSync(presetName = 'turbosquid_product') {
    this.syncWithViewport = true;
    this.previewMode = true;
    
    this.cameraManager.enableExportPreview(presetName);
    
    const preset = this.resolutionPresets[presetName];
    if (preset) {
      console.log(`🔄 Viewport sync enabled: ${presetName} (${preset.width}x${preset.height})`);
    }
  }

  /**
   * ADDED: Disable viewport synchronization
   */
  disableViewportSync() {
    this.syncWithViewport = false;
    this.previewMode = false;
    
    this.cameraManager.disableExportPreview();
    console.log('👁️ Viewport sync disabled');
  }

  /**
   * MODIFIED: Capture with viewport synchronization
   */
  async captureView(viewName, options = {}) {
    if (!this.scene) {
      throw new Error('Scene not set. Call setScene() first.');
    }
    
    const camera = this.cameraManager.getCamera(viewName);
    if (!camera) {
      throw new Error(`Camera not found for view: ${viewName}`);
    }
    
    // Prepare export settings
    const exportOptions = this.prepareExportOptions(viewName, options);
    
    // ADDED: Sync views with export if enabled
    if (this.syncWithViewport) {
      this.cameraManager.syncWithExportSettings(exportOptions);
    }
    
    const canvas = this.renderer.canvases[viewName];
    if (!canvas) {
      throw new Error(`Canvas not found for view: ${viewName}`);
    }
    
    let imageData;
    
    if (exportOptions.highResolution) {
      imageData = await this.captureHighResolution(viewName, camera, exportOptions);
    } else {
      imageData = await this.captureCurrentResolution(viewName, camera, exportOptions);
    }
    
    return {
      viewName,
      imageData,
      resolution: exportOptions.resolution,
      format: exportOptions.format,
      timestamp: new Date().toISOString(),
      filename: this.generateFilename(viewName, exportOptions),
      syncedWithViewport: this.syncWithViewport
    };
  }

  /**
   * MODIFIED: Capture with sync consideration
   */
  async captureCurrentResolution(viewName, camera, options) {
    const canvas = this.renderer.canvases[viewName];
    
    // If synced, camera already has correct aspect ratio
    if (this.syncWithViewport) {
      this.renderer.renderSingle(viewName, this.scene, camera, {
        background: options.background
      });
      
      return canvas.toDataURL(options.format, options.quality);
    }
    
    // Original logic for non-synced mode
    const canvasSize = this.renderer.getCanvasSize(viewName);
    if (!canvasSize) {
      return canvas.toDataURL(options.format, options.quality);
    }
    
    this.updateCameraAspectRatio(camera, canvasSize.aspectRatio);
    
    this.renderer.renderSingle(viewName, this.scene, camera, {
      background: options.background
    });
    
    return canvas.toDataURL(options.format, options.quality);
  }

  /**
   * Capture at high resolution using off-screen renderer
   */
  async captureHighResolution(viewName, camera, options) {
    const { renderer: offscreenRenderer, canvas: offscreenCanvas } = 
      this.renderer.createOffscreenRenderer(options.resolution.width, options.resolution.height);
    
    try {
      // Calculate aspect ratio for export
      const exportAspect = options.resolution.width / options.resolution.height;
      
      // Create camera with correct aspect ratio for export
      const exportCamera = this.createExportCamera(camera, exportAspect);
      
      // Render at high resolution
      const sceneObject = this.scene.getScene();
      
      // Apply background if specified
      const originalBackground = sceneObject.background;
      if (options.background !== undefined) {
        sceneObject.background = options.background;
      }
      
      offscreenRenderer.render(sceneObject, exportCamera);
      
      // Capture image
      const imageData = offscreenCanvas.toDataURL(options.format, options.quality);
      
      // Restore original background
      if (options.background !== undefined) {
        sceneObject.background = originalBackground;
      }
      
      return imageData;
      
    } finally {
      // Always cleanup
      offscreenRenderer.dispose();
    }
  }

  /**
   * Create export camera with correct aspect ratio
   */
  createExportCamera(originalCamera, aspectRatio) {
    if (originalCamera.isOrthographicCamera) {
      const frustumSize = this.cameraManager.frustumSize || 4;
      
      const exportCamera = new THREE.OrthographicCamera(
        -frustumSize * aspectRatio / 2,  // left
        frustumSize * aspectRatio / 2,   // right
        frustumSize / 2,                 // top
        -frustumSize / 2,                // bottom
        originalCamera.near,
        originalCamera.far
      );
      
      // Copy position and orientation
      exportCamera.position.copy(originalCamera.position);
      exportCamera.lookAt(this.cameraManager.target);
      exportCamera.up.copy(originalCamera.up);
      exportCamera.updateProjectionMatrix();
      
      return exportCamera;
    } else {
      // For perspective cameras
      const exportCamera = originalCamera.clone();
      exportCamera.aspect = aspectRatio;
      exportCamera.updateProjectionMatrix();
      return exportCamera;
    }
  }

  /**
   * Update camera aspect ratio
   */
  updateCameraAspectRatio(camera, aspectRatio) {
    if (camera.isOrthographicCamera) {
      const frustumSize = this.cameraManager.frustumSize || 4;
      
      camera.left = -frustumSize * aspectRatio / 2;
      camera.right = frustumSize * aspectRatio / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      
      camera.updateProjectionMatrix();
    } else if (camera.isPerspectiveCamera) {
      camera.aspect = aspectRatio;
      camera.updateProjectionMatrix();
    }
  }

  /**
   * Capture multiple views with consistent aspect ratios
   */
  async captureAllViews(options = {}) {
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const results = [];
    
    for (const viewName of viewNames) {
      try {
        const result = await this.captureView(viewName, options);
        results.push(result);
        
        // Small delay between captures to prevent performance issues
        await this.delay(100);
        
      } catch (error) {
        console.error(`Failed to capture ${viewName}:`, error);
        results.push({
          viewName,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  /**
   * MODIFIED: Export options with sync consideration
   */
  prepareExportOptions(viewName, options) {
    let canvasSize = null;
    
    // In sync mode, use export bounds as reference
    if (this.syncWithViewport && this.cameraManager.exportPreviewMode) {
      const bounds = this.cameraManager.getExportPreviewBounds();
      if (bounds) {
        canvasSize = {
          width: Math.floor(bounds.width * 100),
          height: Math.floor(bounds.height * 100),
          aspectRatio: bounds.aspect,
          renderWidth: Math.floor(bounds.width * 100),
          renderHeight: Math.floor(bounds.height * 100)
        };
      }
    } else {
      canvasSize = this.renderer.getCanvasSize(viewName);
    }
    
    const currentAspect = canvasSize ? canvasSize.aspectRatio : 1.0;
    
    const defaults = {
      resolution: canvasSize ? {
        width: Math.floor(canvasSize.width * 2),
        height: Math.floor(canvasSize.height * 2)
      } : this.resolutionPresets.turbosquid_product,
      format: 'image/png',
      quality: 0.95,
      background: this.backgroundPresets.turbosquid,
      wireframe: false,
      shadows: true,
      antiAlias: true,
      filename: null,
      highResolution: false
    };
    
    const exportOptions = { ...defaults, ...options };
    
    // Resolve resolution preset
    if (typeof exportOptions.resolution === 'string') {
      exportOptions.resolution = this.resolutionPresets[exportOptions.resolution] || defaults.resolution;
    }
    
    // ADDED: Sync mode maintains export aspect ratio
    if (this.syncWithViewport && this.cameraManager.exportAspectRatio) {
      const exportAspect = this.cameraManager.exportAspectRatio;
      const targetWidth = exportOptions.resolution.width;
      const targetHeight = Math.floor(targetWidth / exportAspect);
      
      exportOptions.resolution = {
        width: targetWidth,
        height: targetHeight
      };
      
      console.log(`🎯 Export synced: ${targetWidth}x${targetHeight} (${exportAspect.toFixed(2)}:1)`);
    }
    // Original aspect ratio maintenance
    else if (options.maintainAspectRatio !== false && canvasSize) {
      const targetWidth = exportOptions.resolution.width;
      const targetHeight = Math.floor(targetWidth / currentAspect);
      
      exportOptions.resolution = {
        width: targetWidth,
        height: targetHeight
      };
      
      console.log(`📐 Aspect maintained: ${targetWidth}x${targetHeight} (${currentAspect.toFixed(2)}:1)`);
    }
    
    // Resolve background
    if (typeof exportOptions.background === 'string') {
      exportOptions.background = this.backgroundPresets[exportOptions.background];
    }
    
    // Determine if high-resolution export is needed
    if (canvasSize) {
      const scaleFactor = exportOptions.resolution.width / canvasSize.renderWidth;
      exportOptions.highResolution = scaleFactor > 1.5;
    }
    
    return exportOptions;
  }

  /**
   * ADDED: Capture with exact preview guarantee
   */
  async captureViewWithExactPreview(viewName, options = {}) {
    const wasSync = this.syncWithViewport;
    
    if (!wasSync) {
      this.enableViewportSync(options.preset || 'turbosquid_product');
    }
    
    try {
      const result = await this.captureView(viewName, options);
      return {
        ...result,
        isExactPreview: true
      };
    } finally {
      if (!wasSync) {
        this.disableViewportSync();
      }
    }
  }

  /**
   * ADDED: Get sync information
   */
  getSyncInfo() {
    return {
      syncWithViewport: this.syncWithViewport,
      previewMode: this.previewMode,
      cameraPreview: this.cameraManager.getExportPreviewInfo(),
      availablePresets: Object.keys(this.resolutionPresets)
    };
  }

  /**
   * ADDED: Check if view matches export
   */
  isViewMatchingExport(viewName) {
    if (!this.syncWithViewport) return false;
    
    const bounds = this.cameraManager.getExportPreviewBounds();
    const canvasSize = this.renderer.getCanvasSize(viewName);
    
    if (!bounds || !canvasSize) return false;
    
    const viewAspect = canvasSize.aspectRatio;
    const exportAspect = bounds.aspect;
    
    return Math.abs(viewAspect - exportAspect) < 0.01;
  }

  /**
   * ADDED: Get view/export difference
   */
  getViewExportDifference(viewName) {
    const canvasSize = this.renderer.getCanvasSize(viewName);
    const bounds = this.cameraManager.getExportPreviewBounds();
    
    if (!canvasSize || !bounds) return null;
    
    return {
      viewAspect: canvasSize.aspectRatio,
      exportAspect: bounds.aspect,
      aspectDifference: Math.abs(canvasSize.aspectRatio - bounds.aspect),
      cropFactor: this.cameraManager.getViewportCropFactor(canvasSize),
      isMatching: this.isViewMatchingExport(viewName)
    };
  }

  /**
   * Generate filename for export
   */
  generateFilename(viewName, options = {}) {
    const {
      prefix = 'model',
      marketplace = 'export',
      resolution,
      format = 'png',
      timestamp = true
    } = options;
    
    const parts = [prefix];
    
    if (marketplace !== 'export') {
      parts.push(marketplace);
    }
    
    parts.push(viewName);
    
    if (resolution) {
      parts.push(`${resolution.width}x${resolution.height}`);
    }
    
    if (timestamp) {
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 19).replace(/[T:]/g, '_');
      parts.push(dateStr);
    }
    
    const extension = format.split('/')[1] || 'png';
    
    return `${parts.join('_')}.${extension}`;
  }

  /**
   * Create wireframe version
   */
  async captureWireframe(viewName, options = {}) {
    const wireframeOptions = {
      ...options,
      wireframe: true,
      background: this.backgroundPresets.white,
      shadows: false
    };
    
    return this.captureView(viewName, wireframeOptions);
  }

  /**
   * Create turntable sequence
   */
  async captureTurntable(options = {}) {
    const {
      frames = 24,
      viewName = 'front'
    } = options;
    
    const results = [];
    
    for (let frame = 0; frame < frames; frame++) {
      const frameOptions = {
        ...options,
        filename: `turntable_frame_${frame.toString().padStart(3, '0')}`
      };
      
      const result = await this.captureView(viewName, frameOptions);
      results.push({
        ...result,
        frame,
        angle: (frame / frames) * 360
      });
      
      await this.delay(50);
    }
    
    return results;
  }

  /**
   * Create contact sheet with proper aspect ratios
   */
  async createContactSheet(options = {}) {
    const {
      resolution = { width: 3840, height: 2560 },
      cols = 3,
      rows = 2,
      padding = 20,
      background = '#f7f7f7',
      labels = true
    } = options;
    
    const viewWidth = Math.floor((resolution.width - padding * (cols + 1)) / cols);
    const viewHeight = Math.floor((resolution.height - padding * (rows + 1)) / rows);
    
    const views = await this.captureAllViews({
      resolution: { width: viewWidth, height: viewHeight },
      maintainAspectRatio: true,
      ...options
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, resolution.width, resolution.height);
    
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    for (let i = 0; i < viewNames.length; i++) {
      const view = views.find(v => v.viewName === viewNames[i]);
      if (!view || view.error) continue;
      
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = padding + col * (viewWidth + padding);
      const y = padding + row * (viewHeight + padding);
      
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = view.imageData;
      });
      
      ctx.drawImage(img, x, y, viewWidth, viewHeight);
      
      if (labels) {
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          this.getViewDisplayName(viewNames[i]),
          x + viewWidth / 2,
          y + viewHeight + 30
        );
      }
    }
    
    return canvas.toDataURL('image/png', 0.95);
  }

  /**
   * Get display name for view
   */
  getViewDisplayName(viewName) {
    const names = {
      front: 'Front',
      back: 'Back',
      left: 'Left',
      right: 'Right',
      top: 'Top',
      bottom: 'Bottom'
    };
    
    return names[viewName] || viewName;
  }

  /**
   * Utility: Add delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get export statistics
   */
  getExportStats() {
    return {
      isExporting: this.isExporting,
      resolutionPresets: Object.keys(this.resolutionPresets),
      backgroundPresets: Object.keys(this.backgroundPresets),
      supportedFormats: ['image/png', 'image/jpeg', 'image/webp']
    };
  }

  /**
   * Dispose of exporter resources
   */
  dispose() {
    this.isExporting = false;
    console.log('🗑️ Image exporter disposed');
  }
}
