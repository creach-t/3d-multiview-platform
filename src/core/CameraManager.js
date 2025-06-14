/**
 * CameraManager.js - Multi-Camera Management for 6 Orthographic Views
 * Manages Front, Back, Left, Right, Top, Bottom cameras with synchronized controls
 * FIXED: Proper orientation handling for all views
 */

import * as THREE from 'three';

export class CameraManager {
  constructor() {
    this.cameras = {};
    this.target = new THREE.Vector3(0, 0, 0);
    this.distance = 5;
    this.frustumSize = 4;

    // Camera positions for orthographic views (normalized)
    this.viewPositions = {
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1),
      left: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(1, 0, 0),
      top: new THREE.Vector3(0, 1, 0),
      bottom: new THREE.Vector3(0, -1, 0)
    };

    // FIXED: Correct UP vectors for each view
    this.viewUpVectors = {
      front: new THREE.Vector3(0, 1, 0), // Y-up
      back: new THREE.Vector3(0, 1, 0), // Y-up
      left: new THREE.Vector3(0, 1, 0), // Y-up
      right: new THREE.Vector3(0, 1, 0), // Y-up
      top: new THREE.Vector3(0, 0, -1), // Z-down for top view
      bottom: new THREE.Vector3(0, 0, 1) // Z-up for bottom view
    };

    // View orientations for consistent coordinate mapping
    this.viewOrientations = {
      front: { right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
      back: { right: new THREE.Vector3(-1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
      left: { right: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0) },
      right: { right: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0) },
      top: { right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 0, -1) },
      bottom: { right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 0, 1) }
    };

    this.aspectRatio = 1; // Will be updated per viewport

    this.initCameras();
  }

  /**
   * Initialize all 6 orthographic cameras
   */
  initCameras() {
    Object.keys(this.viewPositions).forEach((viewName) => {
      this.cameras[viewName] = this.createOrthographicCamera(viewName);
    });

    this.updateAllCameraPositions();
    console.log('📷 Initialized 6 orthographic cameras with proper orientations');
  }

  /**
   * Create an orthographic camera for a specific view
   */
  createOrthographicCamera(viewName) {
    const frustum = this.frustumSize;
    const aspect = this.aspectRatio;

    const camera = new THREE.OrthographicCamera(
      (-frustum * aspect) / 2, // left
      (frustum * aspect) / 2, // right
      frustum / 2, // top
      -frustum / 2, // bottom
      0.1, // near
      1000 // far
    );

    camera.name = `${viewName}Camera`;
    camera.userData = { viewName };

    return camera;
  }

  /**
   * Update all camera positions based on current target and distance
   */
  updateAllCameraPositions() {
    Object.entries(this.viewPositions).forEach(([viewName, position]) => {
      this.updateCameraPosition(viewName);
    });
  }

  /**
   * FIXED: Simplified camera position update without matrix manipulation
   */
  updateCameraPosition(viewName) {
    const camera = this.cameras[viewName];
    const position = this.viewPositions[viewName];
    const upVector = this.viewUpVectors[viewName];

    if (!camera || !position) return;

    // Calculate camera position
    const cameraPosition = position.clone().multiplyScalar(this.distance).add(this.target);
    camera.position.copy(cameraPosition);

    // Set camera orientation using proper up vector
    camera.up.copy(upVector);
    camera.lookAt(this.target);

    // REMOVED: No special matrix manipulation - let Three.js handle it naturally
    camera.updateProjectionMatrix();

    console.log(`📷 Updated ${viewName} camera position`);
  }

  /**
   * Set target point for all cameras
   */
  setTarget(target) {
    this.target.copy(target);
    this.updateAllCameraPositions();
  }

  /**
   * Set distance from target for all cameras
   */
  setDistance(distance) {
    this.distance = Math.max(0.1, distance);
    this.updateAllCameraPositions();
  }

  /**
   * Set frustum size (zoom level) for all cameras
   */
  setFrustumSize(size) {
    this.frustumSize = Math.max(0.1, size);
    this.updateCameraFrustums();
  }

  /**
   * Update camera frustums for all cameras
   */
  updateCameraFrustums() {
    Object.entries(this.cameras).forEach(([viewName, camera]) => {
      const aspect = camera.userData.aspect || this.aspectRatio;
      const frustum = this.frustumSize;

      // Uniform frustum calculation for ALL views
      camera.left = (-frustum * aspect) / 2;
      camera.right = (frustum * aspect) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;

      camera.updateProjectionMatrix();

      console.log(
        `📐 Updated ${viewName} frustum: aspect=${aspect.toFixed(2)}, size=${frustum.toFixed(2)}`
      );
    });
  }

  /**
   * FIXED: Robust aspect ratio handling with fallback to global aspect
   */
  updateAspectRatios(viewportSizes = {}) {
    // First, determine if we have valid viewport sizes
    const hasValidSizes =
      Object.keys(viewportSizes).length > 0 &&
      Object.values(viewportSizes).some(
        (size) => size && size.width && size.height && size.width > 0 && size.height > 0
      );

    // If we have at least one valid size, use it as reference for all views
    let referenceAspect = this.aspectRatio;
    if (hasValidSizes) {
      const validSize = Object.values(viewportSizes).find(
        (size) => size && size.width && size.height && size.width > 0 && size.height > 0
      );
      if (validSize) {
        referenceAspect = validSize.width / validSize.height;
        console.log(
          `📐 Using reference aspect ratio: ${referenceAspect.toFixed(2)} from ${validSize.width}x${validSize.height}`
        );
      }
    }

    Object.entries(this.cameras).forEach(([viewName, camera]) => {
      const size = viewportSizes[viewName];
      let aspect = referenceAspect;

      // Use individual size if available and valid, otherwise use reference
      if (size && size.width && size.height && size.width > 0 && size.height > 0) {
        aspect = size.width / size.height;
      }

      // Store aspect ratio in userData
      camera.userData.aspect = aspect;

      // Apply uniform frustum calculation
      const frustum = this.frustumSize;
      camera.left = (-frustum * aspect) / 2;
      camera.right = (frustum * aspect) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;

      camera.updateProjectionMatrix();

      console.log(
        `📏 ${viewName}: aspect=${aspect.toFixed(2)} (${size?.width || 'ref'}x${size?.height || 'ref'})`
      );
    });
  }

  /**
   * Frame object in all views (auto-zoom to fit)
   */
  frameModel(model) {
    if (!model) return;

    // Calculate model bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Set target to model center
    this.setTarget(center);

    // Calculate appropriate distance and frustum size
    const maxDimension = Math.max(size.x, size.y, size.z);
    const newFrustumSize = maxDimension * 1.2; // Add 20% padding

    this.setFrustumSize(newFrustumSize);

    // Distance should be far enough to avoid clipping
    const newDistance = Math.max(this.distance, maxDimension * 2);
    this.setDistance(newDistance);

    console.log(
      `📐 Framed model - Size: ${maxDimension.toFixed(2)}, Frustum: ${newFrustumSize.toFixed(2)}`
    );
  }

  /**
   * Get camera for specific view
   */
  getCamera(viewName) {
    return this.cameras[viewName];
  }

  /**
   * Get all cameras
   */
  getAllCameras() {
    return { ...this.cameras };
  }

  /**
   * Reset all cameras to default positions
   */
  reset() {
    this.target.set(0, 0, 0);
    this.distance = 5;
    this.frustumSize = 4;

    this.updateAllCameraPositions();
    this.updateCameraFrustums();

    console.log('🔄 Reset all cameras to default positions');
  }

  /**
   * Zoom all cameras by factor
   */
  zoom(factor) {
    const newFrustumSize = this.frustumSize * factor;
    this.setFrustumSize(newFrustumSize);
  }

  /**
   * Pan all cameras (move target)
   */
  pan(deltaX, deltaY, viewName = 'front') {
    // Scale movement by frustum size for consistent feel across zoom levels
    const scale = this.frustumSize * 0.5;

    // Use view orientations for consistent coordinate mapping
    const orientation = this.viewOrientations[viewName];
    if (!orientation) {
      console.warn(`No orientation defined for view: ${viewName}`);
      return;
    }

    // Calculate movement vector using the view's orientation
    const movement = new THREE.Vector3()
      .addScaledVector(orientation.right, deltaX * scale)
      .addScaledVector(orientation.up, deltaY * scale);

    // Apply movement to target
    this.target.add(movement);
    this.updateAllCameraPositions();

    console.log(
      `Pan ${viewName}: δ(${deltaX.toFixed(3)},${deltaY.toFixed(3)}) -> (${movement.x.toFixed(3)},${movement.y.toFixed(3)},${movement.z.toFixed(3)})`
    );
  }

  /**
   * Set up view for specific marketplace requirements
   */
  setupForMarketplace(marketplace) {
    switch (marketplace) {
      case 'turbosquid':
        // TurboSquid prefers square aspect ratio for search images
        this.setupSquareAspect();
        break;
      case 'cgtrader':
        // CGTrader recommends 1.3-1.35 aspect ratio
        this.setupCGTraderAspect();
        break;
      default:
        this.setupDefaultAspect();
    }
  }

  /**
   * Setup square aspect ratio (1:1)
   */
  setupSquareAspect() {
    this.aspectRatio = 1.0;
    this.updateCameraFrustums();
  }

  /**
   * Setup CGTrader recommended aspect ratio
   */
  setupCGTraderAspect() {
    this.aspectRatio = 1.35;
    this.updateCameraFrustums();
  }

  /**
   * Setup default aspect ratio
   */
  setupDefaultAspect() {
    this.aspectRatio = 16 / 9;
    this.updateCameraFrustums();
  }

  /**
   * Create perspective camera for specific view (alternative mode)
   */
  createPerspectiveCamera(viewName, fov = 45) {
    const aspect = this.aspectRatio;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);

    // Position like orthographic camera but with perspective
    const position = this.viewPositions[viewName];
    const upVector = this.viewUpVectors[viewName];

    const cameraPosition = position.clone().multiplyScalar(this.distance).add(this.target);
    camera.position.copy(cameraPosition);
    camera.up.copy(upVector);
    camera.lookAt(this.target);

    camera.name = `${viewName}PerspectiveCamera`;
    camera.userData = { viewName, type: 'perspective' };

    return camera;
  }

  /**
   * Switch between orthographic and perspective cameras
   */
  switchToMode(mode = 'orthographic') {
    if (mode === 'perspective') {
      // Replace orthographic cameras with perspective ones
      Object.keys(this.cameras).forEach((viewName) => {
        this.cameras[viewName] = this.createPerspectiveCamera(viewName);
      });
    } else {
      // Switch back to orthographic
      this.initCameras();
    }

    console.log(`📷 Switched to ${mode} cameras`);
  }

  /**
   * Get camera parameters for export
   */
  getCameraParameters(viewName) {
    const camera = this.cameras[viewName];
    if (!camera) return null;

    return {
      position: camera.position.clone(),
      target: this.target.clone(),
      up: camera.up.clone(),
      frustumSize: this.frustumSize,
      distance: this.distance,
      type: camera.userData.type || 'orthographic'
    };
  }

  /**
   * Apply camera parameters
   */
  applyCameraParameters(viewName, params) {
    const camera = this.cameras[viewName];
    if (!camera || !params) return;

    camera.position.copy(params.position);
    this.target.copy(params.target);
    camera.up.copy(params.up);

    if (params.frustumSize) {
      this.frustumSize = params.frustumSize;
      this.updateCameraFrustums();
    }

    if (params.distance) {
      this.distance = params.distance;
    }

    camera.lookAt(this.target);
    camera.updateProjectionMatrix();
  }

  /**
   * Save camera state
   */
  saveState() {
    return {
      target: this.target.clone(),
      distance: this.distance,
      frustumSize: this.frustumSize,
      aspectRatio: this.aspectRatio
    };
  }

  /**
   * Restore camera state
   */
  restoreState(state) {
    if (!state) return;

    this.target.copy(state.target);
    this.distance = state.distance;
    this.frustumSize = state.frustumSize;
    this.aspectRatio = state.aspectRatio;

    this.updateAllCameraPositions();
    this.updateCameraFrustums();
  }

  /**
   * Get view matrix for specific camera
   */
  getViewMatrix(viewName) {
    const camera = this.cameras[viewName];
    if (!camera) return null;

    camera.updateMatrixWorld();
    return camera.matrixWorldInverse.clone();
  }

  /**
   * Get projection matrix for specific camera
   */
  getProjectionMatrix(viewName) {
    const camera = this.cameras[viewName];
    if (!camera) return null;

    return camera.projectionMatrix.clone();
  }

  /**
   * Dispose of cameras
   */
  dispose() {
    Object.keys(this.cameras).forEach((viewName) => {
      delete this.cameras[viewName];
    });

    this.cameras = {};
    console.log('🗑️ Disposed camera manager');
  }

  /**
   * ADDED: Force uniform aspect ratio for all cameras
   */
  forceUniformAspectRatio(targetAspect = null) {
    // Use provided aspect ratio or calculate from first available viewport
    const aspect = targetAspect || this.aspectRatio;

    console.log(`🔄 Forcing uniform aspect ratio: ${aspect.toFixed(2)} for all views`);

    Object.entries(this.cameras).forEach(([viewName, camera]) => {
      // Store aspect ratio in userData
      camera.userData.aspect = aspect;

      // Apply uniform frustum calculation
      const frustum = this.frustumSize;
      camera.left = (-frustum * aspect) / 2;
      camera.right = (frustum * aspect) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;

      camera.updateProjectionMatrix();

      console.log(`📐 ${viewName}: forced aspect=${aspect.toFixed(2)}`);
    });

    // Update global aspect ratio
    this.aspectRatio = aspect;
  }

  /**
   * ADDED: Debug method to verify camera orientations
   */
  debugCameraOrientations() {
    console.log('🔍 Camera Orientations Debug:');
    Object.entries(this.cameras).forEach(([viewName, camera]) => {
      console.log(`${viewName}:`);
      console.log(
        `  Position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`
      );
      console.log(
        `  Up: (${camera.up.x.toFixed(2)}, ${camera.up.y.toFixed(2)}, ${camera.up.z.toFixed(2)})`
      );
      console.log(
        `  Frustum: L=${camera.left.toFixed(2)}, R=${camera.right.toFixed(2)}, T=${camera.top.toFixed(2)}, B=${camera.bottom.toFixed(2)}`
      );
      console.log(`  Aspect: ${(camera.userData.aspect || this.aspectRatio).toFixed(2)}`);
    });
  }
}
