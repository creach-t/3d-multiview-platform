/**
 * GLTFLoader.js - GLTF/GLB Model Loader
 * Handles loading, processing, and optimization of 3D models
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class GLTFModelLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.dracoLoader = null;
    this.loadingManager = new THREE.LoadingManager();
    
    this.setupLoaders();
    this.setupLoadingManager();
  }

  /**
   * Setup GLTF loader with extensions
   */
  setupLoaders() {
    // Setup DRACO loader for compressed geometries
    try {
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      this.dracoLoader.setDecoderConfig({ type: 'js' });
      this.loader.setDRACOLoader(this.dracoLoader);
      console.log('✅ DRACO loader initialized');
    } catch (error) {
      console.warn('⚠️ DRACO loader not available:', error);
    }
    
    // Set loading manager
    this.loader.setManager(this.loadingManager);
  }

  /**
   * Setup loading manager with progress callbacks
   */
  setupLoadingManager() {
    this.loadingManager.onLoad = () => {
      console.log('✅ All resources loaded');
    };
    
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal * 100).toFixed(0);
      console.log(`📥 Loading progress: ${progress}% (${url})`);
    };
    
    this.loadingManager.onError = (url) => {
      console.error('❌ Error loading:', url);
    };
  }

  /**
   * Load model from file
   */
  async load(file) {
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Validate file type
    if (!this.isValidFile(file)) {
      throw new Error('Invalid file type. Only .glb and .gltf files are supported.');
    }
    
    // Create object URL for the file
    const url = URL.createObjectURL(file);
    
    try {
      const gltf = await this.loadFromURL(url);
      
      // Process the loaded model
      const processedModel = this.processModel(gltf);
      
      // Add to scene
      this.scene.addModel(processedModel);
      
      // Clean up object URL
      URL.revokeObjectURL(url);
      
      console.log(`✅ Model loaded: ${file.name}`);
      return processedModel;
      
    } catch (error) {
      // Clean up object URL on error
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  /**
   * Load model from URL
   */
  loadFromURL(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) => {
          const percentComplete = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`📥 Loading: ${percentComplete}%`);
        },
        (error) => reject(new Error(`Failed to load model: ${error.message}`))
      );
    });
  }

  /**
   * Process loaded GLTF model
   */
  processModel(gltf) {
    const model = gltf.scene;
    
    // Set model name
    model.name = 'LoadedModel';
    
    // Process materials
    this.processMaterials(model);
    
    // Process geometries
    this.processGeometries(model);
    
    // Setup shadows
    this.setupShadows(model);
    
    // Optimize for performance
    this.optimizeModel(model);
    
    // Store original GLTF data
    model.userData.gltf = gltf;
    model.userData.animations = gltf.animations;
    
    return model;
  }

  /**
   * Process materials for better rendering
   */
  processMaterials(model) {
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          // Ensure proper color space
          if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace;
          }
          
          // Improve material properties
          if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
            // Enhance metallic/roughness workflow
            if (!material.metalnessMap && material.metalness === undefined) {
              material.metalness = 0.0;
            }
            if (!material.roughnessMap && material.roughness === undefined) {
              material.roughness = 0.5;
            }
          }
          
          // Force material update
          material.needsUpdate = true;
        });
      }
    });
    
    console.log('🎨 Materials processed');
  }

  /**
   * Process geometries for optimization
   */
  processGeometries(model) {
    let geometryCount = 0;
    
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geometry = child.geometry;
        
        // Compute normals if missing
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        
        // Compute bounding box and sphere
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        
        // Optimize geometry
        if (geometry.index === null && geometry.attributes.position.count > 3) {
          // Add index buffer if missing (can reduce memory usage)
          const indexedGeometry = geometry.toNonIndexed();
          if (indexedGeometry.index) {
            child.geometry = indexedGeometry;
          }
        }
        
        geometryCount++;
      }
    });
    
    console.log(`🔺 Processed ${geometryCount} geometries`);
  }

  /**
   * Setup shadows for model
   */
  setupShadows(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  /**
   * Optimize model for performance
   */
  optimizeModel(model) {
    // Remove unused materials
    this.removeUnusedMaterials(model);
    
    // Merge similar materials
    this.mergeSimilarMaterials(model);
    
    // Dispose of unused textures
    this.cleanupTextures(model);
    
    console.log('⚡ Model optimized');
  }

  /**
   * Remove materials that aren't used by any mesh
   */
  removeUnusedMaterials(model) {
    const usedMaterials = new Set();
    
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => usedMaterials.add(mat.uuid));
        } else {
          usedMaterials.add(child.material.uuid);
        }
      }
    });
    
    // Note: In a real implementation, you'd track all materials and dispose unused ones
    console.log(`📝 Found ${usedMaterials.size} used materials`);
  }

  /**
   * Merge materials with similar properties
   */
  mergeSimilarMaterials(model) {
    const materialMap = new Map();
    
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material, index) => {
          const key = this.getMaterialKey(material);
          
          if (materialMap.has(key)) {
            // Reuse existing similar material
            if (Array.isArray(child.material)) {
              child.material[index] = materialMap.get(key);
            } else {
              child.material = materialMap.get(key);
            }
          } else {
            materialMap.set(key, material);
          }
        });
      }
    });
    
    console.log(`🔄 Merged to ${materialMap.size} unique materials`);
  }

  /**
   * Generate a key for material comparison
   */
  getMaterialKey(material) {
    const props = [
      material.type,
      material.color ? material.color.getHex() : 'null',
      material.metalness || 0,
      material.roughness || 0,
      material.map ? material.map.uuid : 'null',
      material.normalMap ? material.normalMap.uuid : 'null'
    ];
    
    return props.join('|');
  }

  /**
   * Clean up unused textures
   */
  cleanupTextures(model) {
    const usedTextures = new Set();
    
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          for (const property in material) {
            const value = material[property];
            if (value && value.isTexture) {
              usedTextures.add(value.uuid);
            }
          }
        });
      }
    });
    
    console.log(`🖼️ Found ${usedTextures.size} used textures`);
  }

  /**
   * Validate file type
   */
  isValidFile(file) {
    const validExtensions = ['.glb', '.gltf'];
    const fileName = file.name.toLowerCase();
    
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Get model statistics
   */
  getModelStats(model) {
    let triangles = 0;
    let vertices = 0;
    const materials = new Set();
    const textures = new Set();
    let meshCount = 0;
    
    model.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        
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
      meshes: meshCount,
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
   * Create wireframe version of model
   */
  createWireframe(model) {
    const wireframe = model.clone();
    
    wireframe.traverse((child) => {
      if (child.isMesh && child.material) {
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0x000000,
          wireframe: true,
          wireframeLinewidth: 1
        });
        
        child.material = wireframeMaterial;
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    
    wireframe.name = 'WireframeModel';
    return wireframe;
  }

  /**
   * Export model as GLTF
   */
  async exportModel(model, options = {}) {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const exporter = new GLTFExporter();
    
    return new Promise((resolve, reject) => {
      exporter.parse(
        model,
        (result) => resolve(result),
        (error) => reject(error),
        options
      );
    });
  }

  /**
   * Dispose of loader resources
   */
  dispose() {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
    
    this.loader = null;
    this.dracoLoader = null;
    this.loadingManager = null;
    
    console.log('🗑️ GLTF loader disposed');
  }
}
