/**
 * Controls.js - Synchronized Camera Controls for Multi-View Platform
 * Handles mouse interactions, keyboard shortcuts, and synchronized camera movements
 */

import * as THREE from 'three';

export class Controls {
  constructor(cameraManager, renderer) {
    this.cameraManager = cameraManager;
    this.renderer = renderer;
    this.canvases = renderer.canvases;
    
    // Control state
    this.isEnabled = true;
    this.enableRotate = true;
    this.enableZoom = true;
    this.enablePan = true;
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0;
    
    // Mouse state
    this.mouseState = {
      isDown: false,
      button: -1,
      previousPosition: new THREE.Vector2(),
      currentPosition: new THREE.Vector2(),
      deltaPosition: new THREE.Vector2()
    };
    
    // Touch state for mobile
    this.touchState = {
      touches: [],
      previousDistance: 0,
      currentDistance: 0
    };
    
    // Movement constraints
    this.minDistance = 0.5;
    this.maxDistance = 100;
    this.minZoom = 0.1;
    this.maxZoom = 10;
    
    // Sensitivity settings
    this.rotateSpeed = 1.0;
    this.zoomSpeed = 0.95;
    this.panSpeed = 1.0; // Adjusted for better feel
    
    // Internal state
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    
    // Bind methods to maintain context
    this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this.onDocumentMouseUp = this.onDocumentMouseUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    
    this.setupEventListeners();
    console.log('🎮 Controls initialized with improved drag support');
  }

  /**
   * Setup event listeners for all canvases
   */
  setupEventListeners() {
    Object.entries(this.canvases).forEach(([viewName, canvas]) => {
      this.setupCanvasListeners(canvas, viewName);
    });
    
    // Global keyboard listeners
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    
    // Window events
    window.addEventListener('resize', this.onWindowResize);
  }

  /**
   * Setup event listeners for a specific canvas
   */
  setupCanvasListeners(canvas, viewName) {
    // Create bound event handlers for this specific canvas
    const boundHandlers = {
      mouseDown: (e) => this.onMouseDown(e, viewName),
      mouseMove: (e) => this.onMouseMove(e, viewName),
      mouseUp: (e) => this.onMouseUp(e, viewName),
      wheel: (e) => this.onMouseWheel(e, viewName),
      touchStart: (e) => this.onTouchStart(e, viewName),
      touchMove: (e) => this.onTouchMove(e, viewName),
      touchEnd: (e) => this.onTouchEnd(e, viewName),
      contextMenu: (e) => e.preventDefault()
    };
    
    // Store handlers for cleanup
    canvas._controlHandlers = boundHandlers;
    
    // Mouse events
    canvas.addEventListener('mousedown', boundHandlers.mouseDown);
    canvas.addEventListener('mousemove', boundHandlers.mouseMove);
    canvas.addEventListener('mouseup', boundHandlers.mouseUp);
    canvas.addEventListener('wheel', boundHandlers.wheel);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', boundHandlers.touchStart);
    canvas.addEventListener('touchmove', boundHandlers.touchMove);
    canvas.addEventListener('touchend', boundHandlers.touchEnd);
    
    // Context menu
    canvas.addEventListener('contextmenu', boundHandlers.contextMenu);
    
    // Focus events
    canvas.addEventListener('mouseenter', () => canvas.focus());
    canvas.tabIndex = 0; // Make canvas focusable
    
    // Set cursor style
    canvas.style.cursor = 'grab';
  }

  /**
   * Mouse down event handler
   */
  onMouseDown(event, viewName) {
    if (!this.isEnabled) return;
    
    event.preventDefault();
    
    this.mouseState.isDown = true;
    this.mouseState.button = event.button;
    
    const rect = event.target.getBoundingClientRect();
    this.mouseState.previousPosition.set(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
    
    this.mouseState.currentPosition.copy(this.mouseState.previousPosition);
    
    // Change cursor based on action
    const cursor = this.getCursorForAction(event.button);
    event.target.style.cursor = cursor;
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', this.onDocumentMouseMove);
    document.addEventListener('mouseup', this.onDocumentMouseUp);
    
    console.log(`Mouse down: ${viewName}, button: ${event.button}`);
  }

  /**
   * Mouse move event handler
   */
  onMouseMove(event, viewName) {
    if (!this.isEnabled || !this.mouseState.isDown) return;
    
    event.preventDefault();
    
    const rect = event.target.getBoundingClientRect();
    this.mouseState.currentPosition.set(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
    
    this.mouseState.deltaPosition
      .subVectors(this.mouseState.currentPosition, this.mouseState.previousPosition)
      .multiplyScalar(1 / Math.max(rect.height, rect.width)); // Normalize by canvas size
    
    this.handleMouseMovement(viewName);
    
    this.mouseState.previousPosition.copy(this.mouseState.currentPosition);
  }

  /**
   * Mouse up event handler
   */
  onMouseUp(event, viewName) {
    if (!this.isEnabled) return;
    
    this.mouseState.isDown = false;
    this.mouseState.button = -1;
    
    // Reset cursor
    event.target.style.cursor = 'grab';
    
    // Remove global listeners
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
    
    console.log(`Mouse up: ${viewName}`);
  }

  /**
   * Document mouse move handler (for dragging outside canvas)
   */
  onDocumentMouseMove(event) {
    if (!this.isEnabled || !this.mouseState.isDown) return;
    
    // Find the active canvas
    const activeCanvas = Object.values(this.canvases).find(canvas => 
      canvas.style.cursor !== 'grab'
    );
    
    if (activeCanvas) {
      const rect = activeCanvas.getBoundingClientRect();
      this.mouseState.currentPosition.set(
        event.clientX - rect.left,
        event.clientY - rect.top
      );
      
      this.mouseState.deltaPosition
        .subVectors(this.mouseState.currentPosition, this.mouseState.previousPosition)
        .multiplyScalar(1 / Math.max(rect.height, rect.width));
      
      this.handleMouseMovement('global');
      
      this.mouseState.previousPosition.copy(this.mouseState.currentPosition);
    }
  }

  /**
   * Document mouse up handler
   */
  onDocumentMouseUp(event) {
    if (!this.isEnabled) return;
    
    this.mouseState.isDown = false;
    this.mouseState.button = -1;
    
    // Reset all canvas cursors
    Object.values(this.canvases).forEach(canvas => {
      canvas.style.cursor = 'grab';
    });
    
    // Remove global listeners
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
  }

  /**
   * Get cursor style for action
   */
  getCursorForAction(button) {
    switch (button) {
      case 0: return 'grabbing'; // Left - rotate/orbit
      case 1: return 'ns-resize'; // Middle - zoom
      case 2: return 'move'; // Right - pan
      default: return 'grabbing';
    }
  }

  /**
   * Mouse wheel event handler
   */
  onMouseWheel(event, viewName) {
    if (!this.isEnabled || !this.enableZoom) return;
    
    event.preventDefault();
    
    const delta = event.deltaY;
    const zoomFactor = delta > 0 ? 1 / this.zoomSpeed : this.zoomSpeed;
    
    this.zoom(zoomFactor);
    
    console.log(`Zoom: ${viewName}, factor: ${zoomFactor.toFixed(2)}`);
  }

  /**
   * Handle mouse movement based on button and modifiers
   */
  handleMouseMovement(viewName) {
    const delta = this.mouseState.deltaPosition;
    
    if (Math.abs(delta.x) < 0.001 && Math.abs(delta.y) < 0.001) {
      return; // Too small movement, ignore
    }
    
    switch (this.mouseState.button) {
      case 0: // Left mouse button - orbit/rotate
        if (this.enableRotate) {
          this.orbit(-delta.x * this.rotateSpeed * 3, -delta.y * this.rotateSpeed * 3, viewName);
        }
        break;
        
      case 2: // Right mouse button - pan
        if (this.enablePan) {
          this.pan(delta.x * this.panSpeed, delta.y * this.panSpeed, viewName);
        }
        break;
        
      case 1: // Middle mouse button - zoom
        if (this.enableZoom) {
          const zoomFactor = 1 + (-delta.y * 3);
          this.zoom(zoomFactor);
        }
        break;
    }
  }

  /**
   * Touch start event handler
   */
  onTouchStart(event, viewName) {
    if (!this.isEnabled) return;
    
    event.preventDefault();
    
    const touches = event.touches;
    this.touchState.touches = Array.from(touches);
    
    if (touches.length === 2) {
      // Two finger touch - store distance for zoom
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      this.touchState.previousDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Touch move event handler
   */
  onTouchMove(event, viewName) {
    if (!this.isEnabled) return;
    
    event.preventDefault();
    
    const touches = event.touches;
    
    if (touches.length === 1 && this.touchState.touches.length === 1) {
      // Single finger - rotate
      const rect = event.target.getBoundingClientRect();
      const deltaX = (touches[0].clientX - this.touchState.touches[0].clientX) / rect.width;
      const deltaY = (touches[0].clientY - this.touchState.touches[0].clientY) / rect.height;
      
      if (this.enableRotate) {
        this.orbit(-deltaX * this.rotateSpeed * 2, -deltaY * this.rotateSpeed * 2, viewName);
      }
    } else if (touches.length === 2) {
      // Two fingers - zoom and pan
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (this.touchState.previousDistance > 0) {
        const zoomFactor = distance / this.touchState.previousDistance;
        if (this.enableZoom) {
          this.zoom(zoomFactor);
        }
      }
      
      this.touchState.previousDistance = distance;
    }
    
    this.touchState.touches = Array.from(touches);
  }

  /**
   * Touch end event handler
   */
  onTouchEnd(event, viewName) {
    if (!this.isEnabled) return;
    
    this.touchState.touches = [];
    this.touchState.previousDistance = 0;
  }

  /**
   * Keyboard event handlers
   */
  onKeyDown(event) {
    if (!this.isEnabled) return;
    
    // Don't interfere with form inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
    
    const step = 0.05; // Made smaller for more precise control
    const zoomStep = 0.1;
    
    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault();
        this.pan(-step, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.pan(step, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.pan(0, step);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.pan(0, -step);
        break;
      case 'Minus':
      case 'NumpadSubtract':
        event.preventDefault();
        this.zoom(1 + zoomStep);
        break;
      case 'Equal':
      case 'NumpadAdd':
        event.preventDefault();
        this.zoom(1 - zoomStep);
        break;
      case 'KeyA':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleAutoRotate();
        }
        break;
    }
  }

  onKeyUp(event) {
    // Handle key up events if needed
  }

  /**
   * Window resize handler
   */
  onWindowResize() {
    // Update camera manager aspect ratios
    const viewportSizes = {};
    Object.entries(this.canvases).forEach(([viewName, canvas]) => {
      const rect = canvas.getBoundingClientRect();
      viewportSizes[viewName] = {
        width: rect.width,
        height: rect.height
      };
    });
    
    if (this.cameraManager && typeof this.cameraManager.updateAspectRatios === 'function') {
      this.cameraManager.updateAspectRatios(viewportSizes);
    }
  }

  /**
   * Orbit around target (now uses CameraManager's orbit method if available)
   */
  orbit(deltaAzimuth, deltaPolar, viewName = 'front') {
    if (!this.enableRotate || !this.cameraManager) return;
    
    // Use CameraManager's orbit method if available, otherwise fall back to pan
    if (typeof this.cameraManager.orbit === 'function') {
      this.cameraManager.orbit(deltaAzimuth, deltaPolar);
      console.log(`Orbit: ${deltaAzimuth.toFixed(3)}, ${deltaPolar.toFixed(3)} via CameraManager`);
    } else {
      // Fallback to pan for visual feedback
      this.pan(deltaAzimuth * 0.5, deltaPolar * 0.5, viewName);
      console.log(`Orbit fallback to pan: ${deltaAzimuth.toFixed(3)}, ${deltaPolar.toFixed(3)}`);
    }
  }

  /**
   * Zoom in/out (change frustum size)
   */
  zoom(factor) {
    if (!this.enableZoom || !this.cameraManager) return;
    
    const currentSize = this.cameraManager.frustumSize || 10;
    const newSize = currentSize * factor;
    
    // Apply constraints
    const constrainedSize = Math.max(this.minZoom, Math.min(this.maxZoom, newSize));
    
    if (typeof this.cameraManager.setFrustumSize === 'function') {
      this.cameraManager.setFrustumSize(constrainedSize);
      console.log(`Zoom: size ${constrainedSize.toFixed(2)}`);
    }
  }

  /**
   * Pan (move target)
   */
  pan(deltaX, deltaY, viewName = 'front') {
    if (!this.enablePan || !this.cameraManager) return;
    
    if (typeof this.cameraManager.pan === 'function') {
      this.cameraManager.pan(deltaX, deltaY, viewName);
      console.log(`Pan: ${deltaX.toFixed(3)}, ${deltaY.toFixed(3)} for ${viewName}`);
    } else {
      console.warn('CameraManager.pan method not available');
    }
  }

  /**
   * Auto-rotate functionality
   */
  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    console.log(`🔄 Auto-rotate: ${this.autoRotate ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update controls (called in animation loop)
   */
  update() {
    if (!this.isEnabled) return;
    
    // Handle auto-rotation
    if (this.autoRotate) {
      const autoRotateAngle = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
      this.orbit(autoRotateAngle, 0);
    }
    
    // Apply any pending spherical delta changes
    if (this.sphericalDelta.radius !== 0 || this.sphericalDelta.theta !== 0 || this.sphericalDelta.phi !== 0) {
      this.spherical.radius += this.sphericalDelta.radius;
      this.spherical.theta += this.sphericalDelta.theta;
      this.spherical.phi += this.sphericalDelta.phi;
      
      // Apply constraints
      this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
      this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));
      
      // Update camera manager
      if (this.cameraManager && typeof this.cameraManager.setDistance === 'function') {
        this.cameraManager.setDistance(this.spherical.radius);
      }
      
      // Reset delta
      this.sphericalDelta.set(0, 0, 0);
    }
  }

  /**
   * Set control constraints
   */
  setConstraints(options = {}) {
    if (options.minDistance !== undefined) this.minDistance = options.minDistance;
    if (options.maxDistance !== undefined) this.maxDistance = options.maxDistance;
    if (options.minZoom !== undefined) this.minZoom = options.minZoom;
    if (options.maxZoom !== undefined) this.maxZoom = options.maxZoom;
  }

  /**
   * Set control sensitivity
   */
  setSensitivity(options = {}) {
    if (options.rotate !== undefined) this.rotateSpeed = options.rotate;
    if (options.zoom !== undefined) this.zoomSpeed = options.zoom;
    if (options.pan !== undefined) this.panSpeed = options.pan;
  }

  /**
   * Enable/disable specific controls
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  setRotateEnabled(enabled) {
    this.enableRotate = enabled;
  }

  setZoomEnabled(enabled) {
    this.enableZoom = enabled;
  }

  setPanEnabled(enabled) {
    this.enablePan = enabled;
  }

  /**
   * Reset controls to default state
   */
  reset() {
    this.autoRotate = false;
    this.spherical.set(this.cameraManager?.distance || 10, Math.PI / 2, 0);
    this.sphericalDelta.set(0, 0, 0);
    
    this.mouseState.isDown = false;
    this.touchState.touches = [];
    
    console.log('🎮 Controls reset');
  }

  /**
   * Get current control state
   */
  getState() {
    const state = {
      autoRotate: this.autoRotate,
      enabled: this.isEnabled,
      enableRotate: this.enableRotate,
      enableZoom: this.enableZoom,
      enablePan: this.enablePan
    };
    
    if (this.cameraManager) {
      if (this.cameraManager.target) state.target = this.cameraManager.target.clone();
      if (this.cameraManager.distance) state.distance = this.cameraManager.distance;
      if (this.cameraManager.frustumSize) state.frustumSize = this.cameraManager.frustumSize;
    }
    
    return state;
  }

  /**
   * Restore control state
   */
  setState(state) {
    if (!state) return;
    
    if (this.cameraManager) {
      if (state.target && typeof this.cameraManager.setTarget === 'function') {
        this.cameraManager.setTarget(state.target);
      }
      if (state.distance && typeof this.cameraManager.setDistance === 'function') {
        this.cameraManager.setDistance(state.distance);
      }
      if (state.frustumSize && typeof this.cameraManager.setFrustumSize === 'function') {
        this.cameraManager.setFrustumSize(state.frustumSize);
      }
    }
    
    this.autoRotate = state.autoRotate || false;
    this.isEnabled = state.enabled !== undefined ? state.enabled : true;
    this.enableRotate = state.enableRotate !== undefined ? state.enableRotate : true;
    this.enableZoom = state.enableZoom !== undefined ? state.enableZoom : true;
    this.enablePan = state.enablePan !== undefined ? state.enablePan : true;
  }

  /**
   * Dispose of controls
   */
  dispose() {
    // Remove event listeners from each canvas
    Object.entries(this.canvases).forEach(([viewName, canvas]) => {
      if (canvas._controlHandlers) {
        canvas.removeEventListener('mousedown', canvas._controlHandlers.mouseDown);
        canvas.removeEventListener('mousemove', canvas._controlHandlers.mouseMove);
        canvas.removeEventListener('mouseup', canvas._controlHandlers.mouseUp);
        canvas.removeEventListener('wheel', canvas._controlHandlers.wheel);
        canvas.removeEventListener('touchstart', canvas._controlHandlers.touchStart);
        canvas.removeEventListener('touchmove', canvas._controlHandlers.touchMove);
        canvas.removeEventListener('touchend', canvas._controlHandlers.touchEnd);
        canvas.removeEventListener('contextmenu', canvas._controlHandlers.contextMenu);
        
        delete canvas._controlHandlers;
      }
    });
    
    // Remove global listeners
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onWindowResize);
    
    // Remove global mouse listeners if still attached
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
    
    console.log('🗑️ Controls disposed');
  }
}
