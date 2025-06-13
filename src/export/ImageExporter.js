/**
 * ImageExporter.js - High-Resolution Image Export System
 * Handles capturing and exporting viewport images with correct aspect ratios
 */

import * as THREE from 'three';

export class ImageExporter {
  constructor(renderer, cameraManager) {
    this.renderer = renderer;
    this.cameraManager = cameraManager;
    this.scene = null; // Will be set from outside
    
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
   * Capture single viewport at high resolution with correct aspect ratio
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
    
    // Get the current canvas
    const canvas = this.renderer.canvases[viewName];
    if (!canvas) {
      throw new Error(`Canvas not found for view: ${viewName}`);
    }
    
    let imageData;
    
    if (exportOptions.highResolution) {
      // High-resolution export using off-screen rendering
      imageData = await this.captureHighResolution(viewName, camera, exportOptions);
    } else {
      // Simple capture from current canvas with aspect ratio correction
      imageData = await this.captureCurrentResolution(viewName, camera, exportOptions);
    }
    
    return {
      viewName,
      imageData,
      resolution: exportOptions.resolution,
      format: exportOptions.format,
      timestamp: new Date().toISOString(),
      filename: this.generateFilename(viewName, exportOptions)
    };
  }

  /**
   * Capture at current resolution with aspect ratio maintained
   */
  async captureCurrentResolution(viewName, camera, options) {
    const canvas = this.renderer.canvases[viewName];
    
    // Get current canvas size and aspect ratio
    const canvasSize = this.renderer.getCanvasSize(viewName);
    if (!canvasSize) {
      // Fallback to direct canvas capture
      return canvas.toDataURL(options.format, options.quality);
    }
    
    // Ensure camera has correct aspect ratio
    this.updateCameraAspectRatio(camera, canvasSize.aspectRatio);
    
    // Re-render with correct aspect ratio
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
   * Prepare export options with defaults and aspect ratio handling
   */
  prepareExportOptions(viewName, options) {
    // Get current canvas size for aspect ratio reference
    const canvasSize = this.renderer.getCanvasSize(viewName);
    const currentAspect = canvasSize ? canvasSize.aspectRatio : 1.0;
    
    const defaults = {
      resolution: canvasSize ? {
        width: Math.floor(canvasSize.width * 2), // 2x current size
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
    
    // Ensure resolution maintains aspect ratio if not explicitly set
    if (options.maintainAspectRatio !== false && canvasSize) {
      const targetWidth = exportOptions.resolution.width;
      const targetHeight = Math.floor(targetWidth / currentAspect);
      
      exportOptions.resolution = {
        width: targetWidth,
        height: targetHeight
      };
      
      console.log(`📐 Maintaining aspect ratio ${currentAspect.toFixed(2)} for ${viewName}: ${targetWidth}x${targetHeight}`);
    }
    
    // Resolve background
    if (typeof exportOptions.background === 'string') {
      exportOptions.background = this.backgroundPresets[exportOptions.background];
    }
    
    // Determine if high-resolution export is needed
    if (canvasSize) {
      const scaleFactor = exportOptions.resolution.width / canvasSize.renderWidth;
      exportOptions.highResolution = scaleFactor > 1.5; // Use high-res for significant upscaling
    }
    
    return exportOptions;
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
      background: this.backgroundPresets.white, // Better contrast for wireframe
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
    
    // For now, just capture the current view multiple times
    // In a full implementation, this would rotate the camera
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
      
      // Small delay between frames
      await this.delay(50);
    }
    
    return results;
  }

  /**
   * Create contact sheet with proper aspect ratios
   */
  async createContactSheet(options = {}) {
    const {
      resolution = { width: 3840, height: 2560 }, // 3:2 ratio
      cols = 3,
      rows = 2,
      padding = 20,
      background = '#f7f7f7',
      labels = true
    } = options;
    
    // Calculate individual view size maintaining aspect ratio
    const viewWidth = Math.floor((resolution.width - padding * (cols + 1)) / cols);
    const viewHeight = Math.floor((resolution.height - padding * (rows + 1)) / rows);
    
    // Capture all views at calculated size
    const views = await this.captureAllViews({
      resolution: { width: viewWidth, height: viewHeight },
      maintainAspectRatio: true,
      ...options
    });
    
    // Create contact sheet canvas
    const canvas = document.createElement('canvas');
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, resolution.width, resolution.height);
    
    // Draw each view
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    for (let i = 0; i < viewNames.length; i++) {
      const view = views.find(v => v.viewName === viewNames[i]);
      if (!view || view.error) continue;
      
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = padding + col * (viewWidth + padding);
      const y = padding + row * (viewHeight + padding);
      
      // Create image element
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = view.imageData;
      });
      
      // Draw image maintaining aspect ratio
      ctx.drawImage(img, x, y, viewWidth, viewHeight);
      
      // Draw label if enabled
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
