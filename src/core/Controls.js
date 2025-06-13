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
    this.panSpeed = 2.0;
    
    // Internal state
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    
    this.setupEventListeners();
    console.log('🎮 Controls initialized');
  }

  /**
   * Setup event listeners for all canvases
   */
  setupEventListeners() {
    Object.entries(this.canvases).forEach(([viewName, canvas]) => {
      this.setupCanvasListeners(canvas, viewName);
    });
    
    // Global keyboard listeners
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Window events
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Setup event listeners for a specific canvas
   */
  setupCanvasListeners(canvas, viewName) {
    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e, viewName));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e, viewName));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e, viewName));
    canvas.addEventListener('wheel', (e) => this.onMouseWheel(e, viewName));
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e, viewName));
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e, viewName));
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e, viewName));
    
    // Context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Focus events
    canvas.addEventListener('mouseenter', () => canvas.focus());
    canvas.tabIndex = 0; // Make canvas focusable
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
    
    // Change cursor
    event.target.style.cursor = 'grabbing';
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', this.onDocumentMouseMove);
    document.addEventListener('mouseup', this.onDocumentMouseUp);
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
      .multiplyScalar(1 / rect.height); // Normalize by canvas height
    
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
  }

  /**
   * Handle mouse movement based on button and modifiers
   */
  handleMouseMovement(viewName) {
    const delta = this.mouseState.deltaPosition;
    
    if (this.mouseState.button === 0) { // Left mouse button
      if (this.enableRotate) {
        this.rotate(-delta.x * this.rotateSpeed, -delta.y * this.rotateSpeed);
      }
    } else if (this.mouseState.button === 2) { // Right mouse button
      if (this.enablePan) {
        this.pan(delta.x * this.panSpeed, delta.y * this.panSpeed, viewName);
      }
    } else if (this.mouseState.button === 1) { // Middle mouse button
      if (this.enableZoom) {
        const zoomFactor = 1 + (-delta.y * 2);
        this.zoom(zoomFactor);
      }
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
        this.rotate(-deltaX * this.rotateSpeed * 2, -deltaY * this.rotateSpeed * 2);
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
    
    const step = 0.1;
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
    
    this.cameraManager.updateAspectRatios(viewportSizes);
  }

  /**
   * Rotate around target
   */
  rotate(deltaAzimuth, deltaPolar) {
    if (!this.enableRotate) return;
    
    // This is a simplified rotation - in a real implementation,
    // you might want to implement proper spherical coordinates
    const rotationSpeed = 0.5;
    
    // For now, we'll implement a simple pan instead of true rotation
    // since orthographic cameras are fixed in position
    this.pan(deltaAzimuth * rotationSpeed, deltaPolar * rotationSpeed);
  }

  /**
   * Zoom in/out (change frustum size)
   */
  zoom(factor) {
    if (!this.enableZoom) return;
    
    const currentSize = this.cameraManager.frustumSize;
    const newSize = currentSize * factor;
    
    // Apply constraints
    const constrainedSize = Math.max(this.minZoom, Math.min(this.maxZoom, newSize));
    
    this.cameraManager.setFrustumSize(constrainedSize);
  }

  /**
   * Pan (move target)
   */
  pan(deltaX, deltaY, viewName = 'front') {
    if (!this.enablePan) return;
    
    this.cameraManager.pan(deltaX, deltaY, viewName);
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
      this.rotate(autoRotateAngle, 0);
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
      this.cameraManager.setDistance(this.spherical.radius);
      
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
    this.spherical.set(this.cameraManager.distance, Math.PI / 2, 0);
    this.sphericalDelta.set(0, 0, 0);
    
    this.mouseState.isDown = false;
    this.touchState.touches = [];
    
    console.log('🎮 Controls reset');
  }

  /**
   * Get current control state
   */
  getState() {
    return {
      target: this.cameraManager.target.clone(),
      distance: this.cameraManager.distance,
      frustumSize: this.cameraManager.frustumSize,
      autoRotate: this.autoRotate,
      enabled: this.isEnabled
    };
  }

  /**
   * Restore control state
   */
  setState(state) {
    if (!state) return;
    
    this.cameraManager.setTarget(state.target);
    this.cameraManager.setDistance(state.distance);
    this.cameraManager.setFrustumSize(state.frustumSize);
    this.autoRotate = state.autoRotate;
    this.isEnabled = state.enabled;
  }

  /**
   * Dispose of controls
   */
  dispose() {
    // Remove event listeners
    Object.values(this.canvases).forEach(canvas => {
      canvas.removeEventListener('mousedown', this.onMouseDown);
      canvas.removeEventListener('mousemove', this.onMouseMove);
      canvas.removeEventListener('mouseup', this.onMouseUp);
      canvas.removeEventListener('wheel', this.onMouseWheel);
      canvas.removeEventListener('touchstart', this.onTouchStart);
      canvas.removeEventListener('touchmove', this.onTouchMove);
      canvas.removeEventListener('touchend', this.onTouchEnd);
      canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    });
    
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onWindowResize);
    
    // Remove global mouse listeners if still attached
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
    
    console.log('🗑️ Controls disposed');
  }

  // Bound methods for event listeners
  onDocumentMouseMove = (event) => this.onMouseMove(event, 'global');
  onDocumentMouseUp = (event) => this.onMouseUp(event, 'global');
}
