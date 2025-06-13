/**
 * ImageExporter.js - High-Resolution Image Export System
 * Handles capturing and exporting viewport images for marketplaces
 */

import * as THREE from 'three';

export class ImageExporter {
  constructor(renderer, cameraManager) {
    this.renderer = renderer;
    this.cameraManager = cameraManager;
    
    // Export settings
    this.exportSettings = {
      format: 'image/png',
      quality: 0.95,
      antialias: true,
      preserveDrawingBuffer: true
    };
    
    // Resolution presets
    this.resolutionPresets = {
      turbosquid_search: { width: 1920, height: 1920 }, // Square for search images
      turbosquid_product: { width: 1920, height: 1080 }, // Product shots
      cgtrader_main: { width: 1920, height: 1440 }, // CGTrader 1.33 ratio
      ultra_hd: { width: 3840, height: 2160 }, // 4K
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
   * Capture single viewport at high resolution
   */
  async captureView(viewName, options = {}) {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }
    
    try {
      this.isExporting = true;
      
      const camera = this.cameraManager.getCamera(viewName);
      if (!camera) {
        throw new Error(`Camera not found for view: ${viewName}`);
      }
      
      // Prepare export settings
      const exportOptions = this.prepareExportOptions(options);
      
      // Capture the image
      const imageData = await this.captureHighResolution(
        viewName,
        camera,
        exportOptions
      );
      
      return {
        viewName,
        imageData,
        resolution: exportOptions.resolution,
        format: exportOptions.format,
        timestamp: new Date().toISOString()
      };
      
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Capture multiple views
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
   * Prepare export options with defaults
   */
  prepareExportOptions(options) {
    const defaults = {
      resolution: this.resolutionPresets.turbosquid_product,
      format: 'image/png',
      quality: 0.95,
      background: 'turbosquid',
      wireframe: false,
      shadows: true,
      antiAlias: true,
      filename: null
    };
    
    const exportOptions = { ...defaults, ...options };
    
    // Resolve resolution preset
    if (typeof exportOptions.resolution === 'string') {
      exportOptions.resolution = this.resolutionPresets[exportOptions.resolution] || defaults.resolution;
    }
    
    // Resolve background
    if (typeof exportOptions.background === 'string') {
      exportOptions.background = this.backgroundPresets[exportOptions.background];
    }
    
    return exportOptions;
  }

  /**
   * Capture high-resolution image using off-screen rendering
   */
  async captureHighResolution(viewName, camera, options) {
    const { resolution, format, quality, background, wireframe, shadows } = options;
    
    // Create off-screen renderer
    const offscreenRenderer = this.createOffscreenRenderer(resolution, options);
    
    try {
      // Get scene from renderer
      const scene = this.getSceneFromRenderer();
      
      // Apply temporary settings
      const originalSettings = this.applyTemporarySettings(scene, {
        background,
        wireframe,
        shadows
      });
      
      // Render at high resolution
      offscreenRenderer.render(scene, camera);
      
      // Capture image data
      const canvas = offscreenRenderer.domElement;
      const imageData = canvas.toDataURL(format, quality);
      
      // Restore original settings
      this.restoreOriginalSettings(scene, originalSettings);
      
      return imageData;
      
    } finally {
      // Clean up off-screen renderer
      offscreenRenderer.dispose();
    }
  }

  /**
   * Create off-screen renderer for high-resolution capture
   */
  createOffscreenRenderer(resolution, options) {
    const canvas = document.createElement('canvas');
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: options.antiAlias,
      preserveDrawingBuffer: true,
      alpha: options.background === null, // Transparent background
      powerPreference: 'high-performance'
    });
    
    // Configure renderer
    renderer.setSize(resolution.width, resolution.height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    if (options.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    return renderer;
  }

  /**
   * Get scene from main renderer
   */
  getSceneFromRenderer() {
    // This would need to be connected to the actual scene
    // For now, we'll assume the scene is available through the renderer
    return this.renderer.scene || new THREE.Scene();
  }

  /**
   * Apply temporary settings for export
   */
  applyTemporarySettings(scene, settings) {
    const originalSettings = {
      background: scene.background,
      materials: new Map(),
      shadows: new Map()
    };
    
    // Change background
    if (settings.background !== undefined) {
      scene.background = settings.background;
    }
    
    // Change materials for wireframe
    if (settings.wireframe) {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((material, index) => {
            originalSettings.materials.set(`${child.uuid}_${index}`, {
              wireframe: material.wireframe,
              wireframeLinewidth: material.wireframeLinewidth
            });
            
            material.wireframe = true;
            material.wireframeLinewidth = 1;
          });
        }
      });
    }
    
    // Change shadow settings
    if (settings.shadows !== undefined) {
      scene.traverse((child) => {
        if (child.isLight && child.castShadow !== undefined) {
          originalSettings.shadows.set(child.uuid, child.castShadow);
          child.castShadow = settings.shadows;
        }
      });
    }
    
    return originalSettings;
  }

  /**
   * Restore original settings after export
   */
  restoreOriginalSettings(scene, originalSettings) {
    // Restore background
    scene.background = originalSettings.background;
    
    // Restore materials
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material, index) => {
          const key = `${child.uuid}_${index}`;
          const original = originalSettings.materials.get(key);
          
          if (original) {
            material.wireframe = original.wireframe;
            material.wireframeLinewidth = original.wireframeLinewidth;
          }
        });
      }
    });
    
    // Restore shadows
    scene.traverse((child) => {
      if (child.isLight && originalSettings.shadows.has(child.uuid)) {
        child.castShadow = originalSettings.shadows.get(child.uuid);
      }
    });
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
   * Download image data as file
   */
  downloadImage(imageData, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = imageData;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Create wireframe version
   */
  async captureWireframe(viewName, options = {}) {
    const wireframeOptions = {
      ...options,
      wireframe: true,
      background: 'white', // Better contrast for wireframe
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
      viewName = 'front',
      rotationAxis = 'y',
      ...captureOptions
    } = options;
    
    const results = [];
    const camera = this.cameraManager.getCamera(viewName);
    
    if (!camera) {
      throw new Error(`Camera not found for view: ${viewName}`);
    }
    
    // Store original camera position
    const originalPosition = camera.position.clone();
    const originalTarget = this.cameraManager.target.clone();
    
    try {
      for (let frame = 0; frame < frames; frame++) {
        const angle = (frame / frames) * Math.PI * 2;
        
        // Rotate camera around target
        const radius = originalPosition.distanceTo(originalTarget);
        const newPosition = new THREE.Vector3();
        
        if (rotationAxis === 'y') {
          newPosition.x = Math.sin(angle) * radius;
          newPosition.y = originalPosition.y;
          newPosition.z = Math.cos(angle) * radius;
        } else if (rotationAxis === 'x') {
          newPosition.x = originalPosition.x;
          newPosition.y = Math.sin(angle) * radius;
          newPosition.z = Math.cos(angle) * radius;
        }
        
        newPosition.add(originalTarget);
        
        // Update camera position
        camera.position.copy(newPosition);
        camera.lookAt(originalTarget);
        
        // Capture frame
        const frameOptions = {
          ...captureOptions,
          filename: `turntable_frame_${frame.toString().padStart(3, '0')}`
        };
        
        const result = await this.captureView(viewName, frameOptions);
        results.push({
          ...result,
          frame,
          angle: angle * 180 / Math.PI
        });
        
        // Small delay between frames
        await this.delay(50);
      }
      
    } finally {
      // Restore original camera position
      camera.position.copy(originalPosition);
      camera.lookAt(originalTarget);
    }
    
    return results;
  }

  /**
   * Create contact sheet (grid of all views)
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
    
    // Capture all views at smaller resolution
    const viewSize = {
      width: Math.floor((resolution.width - padding * (cols + 1)) / cols),
      height: Math.floor((resolution.height - padding * (rows + 1)) / rows)
    };
    
    const views = await this.captureAllViews({
      resolution: viewSize,
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
      
      const x = padding + col * (viewSize.width + padding);
      const y = padding + row * (viewSize.height + padding);
      
      // Create image element
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = view.imageData;
      });
      
      // Draw image
      ctx.drawImage(img, x, y, viewSize.width, viewSize.height);
      
      // Draw label if enabled
      if (labels) {
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          this.getViewDisplayName(viewNames[i]),
          x + viewSize.width / 2,
          y + viewSize.height + 30
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
