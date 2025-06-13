/**
 * Scene.js - 3D Scene Management
 * Handles scene setup, lighting, and model management
 */

import * as THREE from 'three';

export class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    this.models = [];
    this.lights = [];
    this.background = null;
    
    this.setupDefaultScene();
  }

  /**
   * Setup default scene configuration
   */
  setupDefaultScene() {
    // Set default background color (TurboSquid standard)
    this.scene.background = new THREE.Color(0xf7f7f7);
    
    // Add grid helper (optional, can be toggled)
    this.setupGrid();
    
    // Setup default lighting
    this.setupLighting('studio');
  }

  /**
   * Setup grid helper
   */
  setupGrid() {
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
    gridHelper.visible = false; // Hidden by default
    gridHelper.name = 'gridHelper';
    this.scene.add(gridHelper);
  }

  /**
   * Setup lighting based on preset
   */
  setupLighting(preset = 'studio') {
    // Remove existing lights
    this.clearLights();
    
    switch (preset) {
      case 'studio':
        this.setupStudioLighting();
        break;
      case 'natural':
        this.setupNaturalLighting();
        break;
      case 'dramatic':
        this.setupDramaticLighting();
        break;
      case 'technical':
        this.setupTechnicalLighting();
        break;
      default:
        this.setupStudioLighting();
    }
  }

  /**
   * Studio lighting - Professional, even illumination
   */
  setupStudioLighting() {
    // Key light (main light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    keyLight.name = 'keyLight';
    
    // Fill light (softer, opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-3, 3, 2);
    fillLight.name = 'fillLight';
    
    // Back light (rim lighting)
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, 3, -5);
    backLight.name = 'backLight';
    
    // Ambient light (global illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    ambientLight.name = 'ambientLight';
    
    this.addLight(keyLight);
    this.addLight(fillLight);
    this.addLight(backLight);
    this.addLight(ambientLight);
  }

  /**
   * Natural lighting - Daylight simulation
   */
  setupNaturalLighting() {
    // Sun light
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.0);
    sunLight.position.set(10, 10, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.name = 'sunLight';
    
    // Sky light (ambient)
    const skyLight = new THREE.AmbientLight(0x87ceeb, 0.3);
    skyLight.name = 'skyLight';
    
    // Ground reflection
    const groundLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.2);
    groundLight.name = 'groundLight';
    
    this.addLight(sunLight);
    this.addLight(skyLight);
    this.addLight(groundLight);
  }

  /**
   * Dramatic lighting - High contrast, artistic
   */
  setupDramaticLighting() {
    // Strong key light
    const dramaticKey = new THREE.SpotLight(0xffffff, 1.5);
    dramaticKey.position.set(8, 8, 3);
    dramaticKey.angle = Math.PI / 6;
    dramaticKey.penumbra = 0.3;
    dramaticKey.decay = 2;
    dramaticKey.distance = 200;
    dramaticKey.castShadow = true;
    dramaticKey.name = 'dramaticKey';
    
    // Colored rim light
    const rimLight = new THREE.DirectionalLight(0x4169e1, 0.5);
    rimLight.position.set(-5, 2, -3);
    rimLight.name = 'rimLight';
    
    // Minimal ambient
    const minimalAmbient = new THREE.AmbientLight(0x404040, 0.1);
    minimalAmbient.name = 'minimalAmbient';
    
    this.addLight(dramaticKey);
    this.addLight(rimLight);
    this.addLight(minimalAmbient);
  }

  /**
   * Technical lighting - Even, shadowless, for wireframes
   */
  setupTechnicalLighting() {
    // Front light
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(0, 0, 10);
    frontLight.name = 'frontLight';
    
    // Back light
    const backTechLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backTechLight.position.set(0, 0, -10);
    backTechLight.name = 'backTechLight';
    
    // Top light
    const topLight = new THREE.DirectionalLight(0xffffff, 0.6);
    topLight.position.set(0, 10, 0);
    topLight.name = 'topLight';
    
    // Bottom light
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.6);
    bottomLight.position.set(0, -10, 0);
    bottomLight.name = 'bottomLight';
    
    // Strong ambient for even lighting
    const strongAmbient = new THREE.AmbientLight(0xffffff, 0.4);
    strongAmbient.name = 'strongAmbient';
    
    this.addLight(frontLight);
    this.addLight(backTechLight);
    this.addLight(topLight);
    this.addLight(bottomLight);
    this.addLight(strongAmbient);
  }

  /**
   * Setup background based on type
   */
  setupBackground(type = 'turbosquid', customColor = null) {
    switch (type) {
      case 'turbosquid':
        // TurboSquid standard background RGB(247,247,247)
        this.scene.background = new THREE.Color(0xf7f7f7);
        break;
      case 'white':
        this.scene.background = new THREE.Color(0xffffff);
        break;
      case 'transparent':
        this.scene.background = null;
        break;
      case 'gradient':
        this.setupGradientBackground();
        break;
      case 'custom':
        if (customColor) {
          this.scene.background = new THREE.Color(customColor);
        }
        break;
      default:
        this.scene.background = new THREE.Color(0xf7f7f7);
    }
  }

  /**
   * Setup gradient background
   */
  setupGradientBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e3f2fd'); // Light blue
    gradient.addColorStop(1, '#f5f5f5'); // Light gray
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  /**
   * Add a light to the scene
   */
  addLight(light) {
    this.scene.add(light);
    this.lights.push(light);
  }

  /**
   * Clear all lights from the scene
   */
  clearLights() {
    this.lights.forEach(light => {
      this.scene.remove(light);
    });
    this.lights = [];
  }

  /**
   * Add a model to the scene
   */
  addModel(model) {
    this.scene.add(model);
    this.models.push(model);
    
    // Auto-center and scale the model
    this.centerModel(model);
    this.scaleModel(model);
    
    return model;
  }

  /**
   * Remove a model from the scene
   */
  removeModel(model) {
    const index = this.models.indexOf(model);
    if (index > -1) {
      this.scene.remove(model);
      this.models.splice(index, 1);
    }
  }

  /**
   * Clear all models from the scene
   */
  clearModels() {
    this.models.forEach(model => {
      this.scene.remove(model);
    });
    this.models = [];
  }

  /**
   * Center a model at the origin
   */
  centerModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.sub(center);
  }

  /**
   * Scale model to fit in a 2-unit cube
   */
  scaleModel(model, targetSize = 2) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    if (maxDimension > 0) {
      const scale = targetSize / maxDimension;
      model.scale.setScalar(scale);
    }
  }

  /**
   * Get model statistics
   */
  getModelStats(model) {
    let triangles = 0;
    let vertices = 0;
    const materials = new Set();
    const textures = new Set();
    
    model.traverse((child) => {
      if (child.isMesh) {
        const geometry = child.geometry;
        if (geometry) {
          if (geometry.index) {
            triangles += geometry.index.count / 3;
          } else {
            triangles += geometry.attributes.position.count / 3;
          }
          vertices += geometry.attributes.position.count;
        }
        
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              materials.add(mat.uuid);
              this.extractTextures(mat, textures);
            });
          } else {
            materials.add(child.material.uuid);
            this.extractTextures(child.material, textures);
          }
        }
      }
    });
    
    return {
      triangles: Math.floor(triangles),
      vertices,
      materials: materials.size,
      textures: textures.size
    };
  }

  /**
   * Extract textures from material
   */
  extractTextures(material, textureSet) {
    for (const property in material) {
      const value = material[property];
      if (value && value.isTexture) {
        textureSet.add(value.uuid);
      }
    }
  }

  /**
   * Get the scene bounding box
   */
  getBoundingBox() {
    const box = new THREE.Box3();
    
    this.models.forEach(model => {
      const modelBox = new THREE.Box3().setFromObject(model);
      box.union(modelBox);
    });
    
    return box;
  }

  /**
   * Toggle grid visibility
   */
  toggleGrid() {
    const grid = this.scene.getObjectByName('gridHelper');
    if (grid) {
      grid.visible = !grid.visible;
    }
  }

  /**
   * Enable/disable shadows
   */
  setShadows(enabled) {
    this.lights.forEach(light => {
      if (light.castShadow !== undefined) {
        light.castShadow = enabled;
      }
    });
    
    this.models.forEach(model => {
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = enabled;
          child.receiveShadow = enabled;
        }
      });
    });
  }

  /**
   * Set wireframe mode for all models
   */
  setWireframe(enabled) {
    this.models.forEach(model => {
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.wireframe = enabled;
            });
          } else {
            child.material.wireframe = enabled;
          }
        }
      });
    });
  }

  /**
   * Get the Three.js scene object
   */
  getScene() {
    return this.scene;
  }

  /**
   * Dispose of scene resources
   */
  dispose() {
    // Dispose of geometries and materials
    this.models.forEach(model => {
      model.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    
    this.clearModels();
    this.clearLights();
  }
}
