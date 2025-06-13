/**
 * Renderer.js - Multi-Viewport WebGL Renderer
 * Handles rendering to multiple canvases with optimal performance and correct aspect ratios
 */

import * as THREE from 'three';

export class Renderer {
  constructor(canvases) {
    this.canvases = canvases;
    this.renderers = {};
    this.quality = 'standard';
    this.cameraManager = null; // Will be set later for aspect ratio updates
    
    this.settings = {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // Required for screenshots
      powerPreference: 'high-performance'
    };
    
    this.qualityPresets = {
      fast: { resolution: 0.5, samples: 1 },
      standard: { resolution: 1.0, samples: 4 },
      high: { resolution: 1.5, samples: 8 },
      ultra: { resolution: 2.0, samples: 16 }
    };
    
    // Track actual canvas sizes for aspect ratio calculation
    this.canvasSizes = {};
    
    this.initRenderers();
    this.setupEventListeners();
  }

  /**
   * Set camera manager reference for aspect ratio updates
   */
  setCameraManager(cameraManager) {
    this.cameraManager = cameraManager;
  }

  /**
   * Initialize renderers for each viewport
   */
  initRenderers() {
    Object.entries(this.canvases).forEach(([viewName, canvas]) => {
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        ...this.settings
      });
      
      // Configure renderer
      this.configureRenderer(renderer);
      
      // Store renderer reference
      this.renderers[viewName] = renderer;
      
      // Set initial size
      this.updateRendererSize(viewName);
    });
    
    console.log(`✅ Initialized ${Object.keys(this.renderers).length} renderers`);
  }

  /**
   * Configure individual renderer settings
   */
  configureRenderer(renderer) {
    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Set color management
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Performance settings
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.autoClear = true;
    renderer.sortObjects = true;
    
    // Quality settings based on current preset
    const preset = this.qualityPresets[this.quality];
    if (preset.samples > 1) {
      // Enable MSAA if supported
      const gl = renderer.getContext();
      if (gl.getParameter(gl.SAMPLES) > 1) {
        renderer.antialias = true;
      }
    }
  }

  /**
   * Update renderer size for a specific viewport - FIXED VERSION
   */
  updateRendererSize(viewName) {
    const canvas = this.canvases[viewName];
    const renderer = this.renderers[viewName];
    
    if (!canvas || !renderer) return;
    
    // Get the actual container size
    const rect = canvas.getBoundingClientRect();
    const preset = this.qualityPresets[this.quality];
    
    // Calculate render size with quality scaling
    const renderWidth = Math.floor(rect.width * preset.resolution);
    const renderHeight = Math.floor(rect.height * preset.resolution);
    
    // Update renderer size (this sets canvas.width and canvas.height)
    renderer.setSize(renderWidth, renderHeight, false);
    
    // Set CSS size to maintain proper display size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Store the actual display aspect ratio
    const aspectRatio = rect.width / rect.height;
    this.canvasSizes[viewName] = {
      width: rect.width,
      height: rect.height,
      renderWidth,
      renderHeight,
      aspectRatio
    };
    
    // Update camera aspect ratio if camera manager is available
    if (this.cameraManager && typeof this.cameraManager.updateAspectRatios === 'function') {
      const viewportSizes = {};
      viewportSizes[viewName] = {
        width: rect.width,
        height: rect.height
      };
      this.cameraManager.updateAspectRatios(viewportSizes);
    }
    
    console.log(`📐 Updated ${viewName}: ${rect.width}x${rect.height} (ratio: ${aspectRatio.toFixed(2)}) render: ${renderWidth}x${renderHeight}`);
  }

  /**
   * Update all renderer sizes and camera aspect ratios
   */
  updateAllSizes() {
    const viewportSizes = {};
    
    Object.keys(this.renderers).forEach(viewName => {
      this.updateRendererSize(viewName);
      
      // Collect sizes for camera manager update
      const size = this.canvasSizes[viewName];
      if (size) {
        viewportSizes[viewName] = {
          width: size.width,
          height: size.height
        };
      }
    });
    
    // Update all camera aspect ratios at once
    if (this.cameraManager && typeof this.cameraManager.updateAspectRatios === 'function') {
      this.cameraManager.updateAspectRatios(viewportSizes);
    }
  }

  /**
   * Render all viewports
   */
  render(scene, cameras) {
    const sceneObject = scene.getScene();
    
    Object.entries(this.renderers).forEach(([viewName, renderer]) => {
      const camera = cameras[viewName];
      
      if (camera && sceneObject) {
        // Get the actual render dimensions
        const canvas = this.canvases[viewName];
        
        // Set viewport to full canvas size
        renderer.setViewport(0, 0, canvas.width, canvas.height);
        renderer.setScissor(0, 0, canvas.width, canvas.height);
        renderer.setScissorTest(true);
        
        // Render the scene
        renderer.render(sceneObject, camera);
      }
    });
  }

  /**
   * Render single viewport (for capture)
   */
  renderSingle(viewName, scene, camera, options = {}) {
    const renderer = this.renderers[viewName];
    const sceneObject = scene.getScene();
    
    if (!renderer || !camera || !sceneObject) {
      throw new Error(`Cannot render view: ${viewName}`);
    }
    
    // Apply temporary settings if provided
    const originalBackground = sceneObject.background;
    if (options.background !== undefined) {
      sceneObject.background = options.background;
    }
    
    // Render at higher resolution for export
    if (options.exportResolution) {
      const canvas = this.canvases[viewName];
      const originalSize = renderer.getSize(new THREE.Vector2());
      
      // Set export resolution
      renderer.setSize(options.exportResolution.width, options.exportResolution.height, false);
      
      // Update camera aspect ratio for export
      if (this.cameraManager) {
        const exportAspect = options.exportResolution.width / options.exportResolution.height;
        const currentCamera = this.cameraManager.getCamera(viewName);
        if (currentCamera && currentCamera.isOrthographicCamera) {
          const frustum = this.cameraManager.frustumSize || 4;
          currentCamera.left = -frustum * exportAspect / 2;
          currentCamera.right = frustum * exportAspect / 2;
          currentCamera.top = frustum / 2;
          currentCamera.bottom = -frustum / 2;
          currentCamera.updateProjectionMatrix();
        }
      }
      
      renderer.render(sceneObject, camera);
      
      // Restore original size and camera
      renderer.setSize(originalSize.x, originalSize.y, false);
      if (this.cameraManager) {
        this.updateRendererSize(viewName); // This will restore the camera aspect ratio
      }
    } else {
      renderer.render(sceneObject, camera);
    }
    
    // Restore original background
    if (options.background !== undefined) {
      sceneObject.background = originalBackground;
    }
  }

  /**
   * Capture viewport as image data with correct aspect ratio
   */
  captureViewport(viewName, options = {}) {
    const renderer = this.renderers[viewName];
    const canvas = this.canvases[viewName];
    
    if (!renderer || !canvas) {
      throw new Error(`Viewport not found: ${viewName}`);
    }
    
    // Determine format and quality
    const format = options.format || 'image/png';
    const quality = options.quality || 0.95;
    
    // For high-resolution capture, temporarily resize
    if (options.resolution) {
      const originalSize = renderer.getSize(new THREE.Vector2());
      
      // Set new size with proper aspect ratio
      renderer.setSize(options.resolution.width, options.resolution.height, false);
      
      // Update camera aspect ratio for capture
      if (this.cameraManager && options.scene && options.camera) {
        const captureAspect = options.resolution.width / options.resolution.height;
        const camera = options.camera;
        
        if (camera.isOrthographicCamera) {
          const frustum = this.cameraManager.frustumSize || 4;
          camera.left = -frustum * captureAspect / 2;
          camera.right = frustum * captureAspect / 2;
          camera.top = frustum / 2;
          camera.bottom = -frustum / 2;
          camera.updateProjectionMatrix();
        }
        
        // Re-render at new size
        this.renderSingle(viewName, options.scene, options.camera);
      }
      
      // Capture
      const dataURL = canvas.toDataURL(format, quality);
      
      // Restore original size
      renderer.setSize(originalSize.x, originalSize.y, false);
      
      // Restore camera aspect ratio
      if (this.cameraManager) {
        this.updateRendererSize(viewName);
      }
      
      return dataURL;
    }
    
    // Standard capture at current resolution
    return canvas.toDataURL(format, quality);
  }

  /**
   * Set quality preset
   */
  setQuality(quality) {
    if (!this.qualityPresets[quality]) {
      console.warn(`Unknown quality preset: ${quality}`);
      return;
    }
    
    this.quality = quality;
    
    // Update all renderers and aspect ratios
    this.updateAllSizes();
    
    console.log(`🎨 Quality set to: ${quality}`);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    console.log('🔄 Handling window resize...');
    
    // Small delay to ensure DOM has updated
    setTimeout(() => {
      this.updateAllSizes();
    }, 100);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle canvas resize using ResizeObserver if available
    if (window.ResizeObserver) {
      Object.entries(this.canvases).forEach(([viewName, canvas]) => {
        const resizeObserver = new ResizeObserver((entries) => {
          // Use requestAnimationFrame to avoid excessive updates
          requestAnimationFrame(() => {
            this.updateRendererSize(viewName);
          });
        });
        resizeObserver.observe(canvas);
      });
    }
  }

  /**
   * Get canvas size information
   */
  getCanvasSize(viewName) {
    return this.canvasSizes[viewName] || null;
  }

  /**
   * Get all canvas sizes
   */
  getAllCanvasSizes() {
    return { ...this.canvasSizes };
  }

  /**
   * Create off-screen renderer for export with correct aspect ratio
   */
  createOffscreenRenderer(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      ...this.settings
    });
    
    this.configureRenderer(renderer);
    renderer.setSize(width, height, false);
    
    return { renderer, canvas };
  }

  /**
   * Export high-resolution image with maintained aspect ratio
   */
  async exportHighRes(viewName, scene, camera, resolution = { width: 1920, height: 1920 }, options = {}) {
    // Create off-screen renderer
    const { renderer, canvas } = this.createOffscreenRenderer(resolution.width, resolution.height);
    
    try {
      // Update camera aspect ratio for export
      const exportAspect = resolution.width / resolution.height;
      
      if (camera.isOrthographicCamera && this.cameraManager) {
        const frustum = this.cameraManager.frustumSize || 4;
        camera.left = -frustum * exportAspect / 2;
        camera.right = frustum * exportAspect / 2;
        camera.top = frustum / 2;
        camera.bottom = -frustum / 2;
        camera.updateProjectionMatrix();
      }
      
      // Render at high resolution
      const sceneObject = scene.getScene();
      
      // Apply background if specified
      const originalBackground = sceneObject.background;
      if (options.background !== undefined) {
        sceneObject.background = options.background;
      }
      
      renderer.render(sceneObject, camera);
      
      // Capture image
      const format = options.format || 'image/png';
      const quality = options.quality || 0.95;
      const dataURL = canvas.toDataURL(format, quality);
      
      // Restore original background
      if (options.background !== undefined) {
        sceneObject.background = originalBackground;
      }
      
      // Cleanup
      renderer.dispose();
      
      return dataURL;
      
    } catch (error) {
      // Cleanup on error
      renderer.dispose();
      throw error;
    }
  }

  /**
   * Enable/disable shadows globally
   */
  setShadows(enabled) {
    Object.values(this.renderers).forEach(renderer => {
      renderer.shadowMap.enabled = enabled;
    });
  }

  /**
   * Set tone mapping
   */
  setToneMapping(type, exposure = 1.0) {
    const toneMappingTypes = {
      none: THREE.NoToneMapping,
      linear: THREE.LinearToneMapping,
      reinhard: THREE.ReinhardToneMapping,
      cineon: THREE.CineonToneMapping,
      aces: THREE.ACESFilmicToneMapping
    };
    
    const toneMappingType = toneMappingTypes[type] || THREE.ACESFilmicToneMapping;
    
    Object.values(this.renderers).forEach(renderer => {
      renderer.toneMapping = toneMappingType;
      renderer.toneMappingExposure = exposure;
    });
  }

  /**
   * Get renderer info for debugging
   */
  getInfo() {
    const info = {
      renderers: Object.keys(this.renderers).length,
      quality: this.quality,
      canvasSizes: this.canvasSizes,
      capabilities: {}
    };
    
    // Get WebGL capabilities from first renderer
    const firstRenderer = Object.values(this.renderers)[0];
    if (firstRenderer) {
      const gl = firstRenderer.getContext();
      info.capabilities = {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxViewportDimensions: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        samples: gl.getParameter(gl.SAMPLES),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER)
      };
    }
    
    return info;
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo() {
    const info = {
      geometries: 0,
      textures: 0,
      programs: 0,
      total: 0
    };
    
    Object.values(this.renderers).forEach(renderer => {
      const rendererInfo = renderer.info;
      info.geometries += rendererInfo.memory.geometries;
      info.textures += rendererInfo.memory.textures;
      info.programs += rendererInfo.programs?.length || 0;
    });
    
    return info;
  }

  /**
   * Force garbage collection on all renderers
   */
  forceGC() {
    Object.values(this.renderers).forEach(renderer => {
      renderer.renderLists.dispose();
    });
  }

  /**
   * Get specific renderer
   */
  getRenderer(viewName) {
    return this.renderers[viewName];
  }

  /**
   * Get all renderers
   */
  getRenderers() {
    return { ...this.renderers };
  }

  /**
   * Dispose of all renderers
   */
  dispose() {
    Object.entries(this.renderers).forEach(([viewName, renderer]) => {
      renderer.dispose();
      console.log(`🗑️ Disposed renderer: ${viewName}`);
    });
    
    this.renderers = {};
    this.canvases = {};
    this.canvasSizes = {};
  }
}
