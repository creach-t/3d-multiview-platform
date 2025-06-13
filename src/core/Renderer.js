/**
 * Renderer.js - Multi-Viewport WebGL Renderer
 * Handles rendering to multiple canvases with optimal performance
 */

import * as THREE from 'three';

export class Renderer {
  constructor(canvases) {
    this.canvases = canvases;
    this.renderers = {};
    this.quality = 'standard';
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
    
    this.initRenderers();
    this.setupEventListeners();
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
   * Update renderer size for a specific viewport
   */
  updateRendererSize(viewName) {
    const canvas = this.canvases[viewName];
    const renderer = this.renderers[viewName];
    
    if (!canvas || !renderer) return;
    
    const rect = canvas.getBoundingClientRect();
    const preset = this.qualityPresets[this.quality];
    
    const width = Math.floor(rect.width * preset.resolution);
    const height = Math.floor(rect.height * preset.resolution);
    
    renderer.setSize(width, height, false);
    
    // Update canvas style size to maintain aspect ratio
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  /**
   * Render all viewports
   */
  render(scene, cameras) {
    const sceneObject = scene.getScene();
    
    Object.entries(this.renderers).forEach(([viewName, renderer]) => {
      const camera = cameras[viewName];
      
      if (camera && sceneObject) {
        // Set viewport for this renderer
        const canvas = this.canvases[viewName];
        const rect = canvas.getBoundingClientRect();
        
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
      
      renderer.setSize(options.exportResolution.width, options.exportResolution.height, false);
      renderer.render(sceneObject, camera);
      
      // Restore original size
      renderer.setSize(originalSize.x, originalSize.y, false);
    } else {
      renderer.render(sceneObject, camera);
    }
    
    // Restore original background
    if (options.background !== undefined) {
      sceneObject.background = originalBackground;
    }
  }

  /**
   * Capture viewport as image data
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
      renderer.setSize(options.resolution.width, options.resolution.height, false);
      
      // Re-render at new size
      if (options.scene && options.camera) {
        this.renderSingle(viewName, options.scene, options.camera);
      }
      
      // Capture
      const dataURL = canvas.toDataURL(format, quality);
      
      // Restore original size
      renderer.setSize(originalSize.x, originalSize.y, false);
      
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
    
    // Update all renderers
    Object.entries(this.renderers).forEach(([viewName, renderer]) => {
      this.configureRenderer(renderer);
      this.updateRendererSize(viewName);
    });
    
    console.log(`🎨 Quality set to: ${quality}`);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    Object.keys(this.renderers).forEach(viewName => {
      this.updateRendererSize(viewName);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle canvas resize using ResizeObserver if available
    if (window.ResizeObserver) {
      Object.entries(this.canvases).forEach(([viewName, canvas]) => {
        const resizeObserver = new ResizeObserver(() => {
          this.updateRendererSize(viewName);
        });
        resizeObserver.observe(canvas);
      });
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
   * Create off-screen renderer for export
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
   * Export high-resolution image
   */
  async exportHighRes(viewName, scene, camera, resolution = { width: 1920, height: 1920 }, options = {}) {
    // Create off-screen renderer
    const { renderer, canvas } = this.createOffscreenRenderer(resolution.width, resolution.height);
    
    try {
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
  }
}
