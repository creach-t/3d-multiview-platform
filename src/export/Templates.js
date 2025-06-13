/**
 * Templates.js - Marketplace Export Templates
 * Predefined settings and requirements for different 3D marketplaces
 */

export class Templates {
  constructor() {
    this.templates = {
      turbosquid: this.createTurboSquidTemplate(),
      cgtrader: this.createCGTraderTemplate(),
      sketchfab: this.createSketchfabTemplate(),
      unity: this.createUnityTemplate(),
      unreal: this.createUnrealTemplate(),
      custom: this.createCustomTemplate()
    };
    
    // Template validation rules
    this.validationRules = {
      turbosquid: this.createTurboSquidValidation(),
      cgtrader: this.createCGTraderValidation()
    };
  }

  /**
   * TurboSquid Template - Official requirements 2025
   */
  createTurboSquidTemplate() {
    return {
      name: 'TurboSquid',
      description: 'Optimized for TurboSquid marketplace requirements',
      
      // Image requirements
      images: {
        searchImage: {
          required: true,
          resolution: { width: 1920, height: 1920 }, // Square format
          minResolution: { width: 1200, height: 1200 },
          format: 'image/jpeg',
          quality: 0.95,
          background: '#f7f7f7', // RGB(247,247,247) - TurboSquid standard
          description: 'Main search result image - must be square'
        },
        
        productShots: {
          required: true,
          count: { min: 5, max: 20 },
          resolution: { width: 1920, height: 1080 },
          minResolution: { width: 1920, height: 1080 },
          format: 'image/jpeg',
          quality: 0.95,
          background: '#f7f7f7',
          description: 'Additional product view images'
        },
        
        wireframe: {
          required: true,
          resolution: { width: 1920, height: 1080 },
          format: 'image/jpeg',
          quality: 0.95,
          background: '#ffffff',
          wireframe: true,
          description: 'Wireframe view showing topology'
        },
        
        turntable: {
          required: false, // Recommended for CheckMate
          frames: { min: 12, max: 36 },
          resolution: { width: 1920, height: 1080 },
          format: 'image/jpeg',
          description: '360-degree rotation sequence'
        }
      },
      
      // Lighting settings
      lighting: {
        preset: 'studio',
        shadows: true,
        intensity: 1.0,
        description: 'Professional studio lighting'
      },
      
      // Camera settings
      camera: {
        type: 'orthographic',
        views: ['front', 'back', 'left', 'right', 'top', 'bottom'],
        framing: 'auto',
        padding: 0.1
      },
      
      // Naming convention
      naming: {
        prefix: 'TS',
        format: '{prefix}_{model}_{view}_{resolution}_{timestamp}',
        searchImageSuffix: 'search',
        wireframeSuffix: 'wireframe'
      },
      
      // Quality settings
      quality: {
        antiAlias: true,
        shadows: true,
        toneMapping: 'aces',
        exposure: 1.0
      },
      
      // Restrictions
      restrictions: {
        noOverlays: true,
        noWatermarks: true,
        noBorders: true,
        noQRCodes: true,
        noLogos: true
      },
      
      // CheckMate requirements
      checkMate: {
        uvLayout: false, // Required for CheckMate Pro
        materialChannels: false,
        animationFrames: false
      }
    };
  }

  /**
   * CGTrader Template - Optimized for CGTrader
   */
  createCGTraderTemplate() {
    return {
      name: 'CGTrader',
      description: 'Optimized for CGTrader marketplace',
      
      images: {
        mainImage: {
          required: true,
          resolution: { width: 1920, height: 1440 }, // 4:3 ratio recommended
          minResolution: { width: 800, height: 600 },
          aspectRatio: { min: 1.3, max: 1.35, optimal: 1.33 },
          format: 'image/jpeg',
          quality: 0.95,
          background: 'flexible', // More flexible than TurboSquid
          description: 'Main product image'
        },
        
        additionalViews: {
          required: false,
          count: { min: 0, max: 50 },
          resolution: { width: 1920, height: 1440 },
          format: 'image/jpeg',
          quality: 0.90,
          description: 'Additional angles and details'
        },
        
        wireframe: {
          required: false,
          resolution: { width: 1920, height: 1440 },
          format: 'image/jpeg',
          quality: 0.90,
          wireframe: true,
          description: 'Optional wireframe view'
        }
      },
      
      lighting: {
        preset: 'natural',
        shadows: true,
        intensity: 0.8
      },
      
      camera: {
        type: 'perspective',
        views: ['front', 'perspective', 'detail'],
        framing: 'dynamic'
      },
      
      naming: {
        prefix: 'CGT',
        format: '{prefix}_{model}_{view}_{timestamp}'
      },
      
      quality: {
        antiAlias: true,
        shadows: true,
        toneMapping: 'linear',
        exposure: 1.2
      },
      
      // SEO optimization
      seo: {
        minDescription: 50, // 50-100 words increase sales by 3x
        maxDescription: 100,
        minTags: 10,
        maxTags: 15,
        categories: 'specific'
      }
    };
  }

  /**
   * Sketchfab Template
   */
  createSketchfabTemplate() {
    return {
      name: 'Sketchfab',
      description: 'Optimized for Sketchfab 3D viewer',
      
      images: {
        thumbnail: {
          required: true,
          resolution: { width: 1200, height: 630 }, // Social media ratio
          format: 'image/jpeg',
          quality: 0.95,
          background: 'dramatic'
        },
        
        screenshots: {
          required: false,
          count: { max: 10 },
          resolution: { width: 1920, height: 1080 },
          format: 'image/png',
          quality: 0.95
        }
      },
      
      lighting: {
        preset: 'dramatic',
        shadows: true,
        intensity: 1.2
      },
      
      camera: {
        type: 'perspective',
        views: ['hero', 'detail1', 'detail2'],
        framing: 'artistic'
      }
    };
  }

  /**
   * Unity Asset Store Template
   */
  createUnityTemplate() {
    return {
      name: 'Unity Asset Store',
      description: 'Optimized for Unity Asset Store',
      
      images: {
        icon: {
          required: true,
          resolution: { width: 160, height: 160 },
          format: 'image/png',
          quality: 1.0,
          background: 'transparent'
        },
        
        cardImage: {
          required: true,
          resolution: { width: 420, height: 280 },
          format: 'image/jpeg',
          quality: 0.95
        },
        
        featureImage: {
          required: true,
          resolution: { width: 1200, height: 630 },
          format: 'image/jpeg',
          quality: 0.95
        },
        
        screenshots: {
          count: { min: 3, max: 10 },
          resolution: { width: 1920, height: 1080 },
          format: 'image/png',
          quality: 0.95
        }
      },
      
      lighting: {
        preset: 'natural',
        shadows: true
      }
    };
  }

  /**
   * Unreal Engine Marketplace Template
   */
  createUnrealTemplate() {
    return {
      name: 'Unreal Engine Marketplace',
      description: 'Optimized for Epic Games Marketplace',
      
      images: {
        thumbnail: {
          required: true,
          resolution: { width: 284, height: 284 },
          format: 'image/png',
          quality: 1.0
        },
        
        featureImage: {
          required: true,
          resolution: { width: 1920, height: 1080 },
          format: 'image/jpeg',
          quality: 0.95
        },
        
        screenshots: {
          count: { min: 4, max: 5 },
          resolution: { width: 1920, height: 1080 },
          format: 'image/jpeg',
          quality: 0.95
        }
      },
      
      lighting: {
        preset: 'dramatic',
        shadows: true,
        intensity: 1.1
      }
    };
  }

  /**
   * Custom Template - User configurable
   */
  createCustomTemplate() {
    return {
      name: 'Custom',
      description: 'User-configurable template',
      
      images: {
        main: {
          required: true,
          resolution: { width: 1920, height: 1080 },
          format: 'image/png',
          quality: 0.95,
          background: '#ffffff'
        }
      },
      
      lighting: {
        preset: 'studio',
        shadows: true
      },
      
      camera: {
        type: 'orthographic',
        views: ['front', 'back', 'left', 'right', 'top', 'bottom']
      },
      
      editable: true
    };
  }

  /**
   * TurboSquid Validation Rules
   */
  createTurboSquidValidation() {
    return {
      searchImage: {
        aspectRatio: { value: 1.0, tolerance: 0.01 },
        minDimensions: { width: 1200, height: 1200 },
        backgroundColor: { 
          required: '#f7f7f7',
          tolerance: 5 // RGB tolerance
        },
        overlays: { allowed: false },
        borders: { allowed: false },
        watermarks: { allowed: false }
      },
      
      productShots: {
        minCount: 5,
        minDimensions: { width: 1920, height: 1080 },
        aspectRatio: { value: 16/9, tolerance: 0.1 }
      },
      
      wireframe: {
        required: true,
        wireframeMode: { required: true },
        background: { preferred: '#ffffff' }
      }
    };
  }

  /**
   * CGTrader Validation Rules
   */
  createCGTraderValidation() {
    return {
      mainImage: {
        aspectRatio: { 
          min: 1.3, 
          max: 1.35, 
          optimal: 1.33 
        },
        minDimensions: { width: 800, height: 600 }
      },
      
      description: {
        minWords: 50,
        maxWords: 100,
        required: true
      },
      
      tags: {
        minCount: 10,
        maxCount: 15,
        required: true
      }
    };
  }

  /**
   * Get template by name
   */
  getTemplate(name) {
    return this.templates[name] || this.templates.custom;
  }

  /**
   * Get all available templates
   */
  getAllTemplates() {
    return Object.keys(this.templates);
  }

  /**
   * Validate export against template
   */
  validateExport(templateName, exportData) {
    const template = this.getTemplate(templateName);
    const validation = this.validationRules[templateName];
    
    if (!validation) {
      return { valid: true, warnings: [], errors: [] };
    }
    
    const result = {
      valid: true,
      warnings: [],
      errors: []
    };
    
    // Validate images
    if (validation.searchImage && exportData.searchImage) {
      this.validateImage(exportData.searchImage, validation.searchImage, result);
    }
    
    if (validation.productShots && exportData.productShots) {
      this.validateProductShots(exportData.productShots, validation.productShots, result);
    }
    
    return result;
  }

  /**
   * Validate individual image
   */
  validateImage(image, rules, result) {
    // Check dimensions
    if (rules.minDimensions) {
      if (image.width < rules.minDimensions.width || 
          image.height < rules.minDimensions.height) {
        result.errors.push(`Image too small: ${image.width}x${image.height}, minimum: ${rules.minDimensions.width}x${rules.minDimensions.height}`);
        result.valid = false;
      }
    }
    
    // Check aspect ratio
    if (rules.aspectRatio) {
      const actualRatio = image.width / image.height;
      const expectedRatio = rules.aspectRatio.value;
      const tolerance = rules.aspectRatio.tolerance || 0.01;
      
      if (Math.abs(actualRatio - expectedRatio) > tolerance) {
        result.warnings.push(`Aspect ratio ${actualRatio.toFixed(2)} differs from optimal ${expectedRatio.toFixed(2)}`);
      }
    }
    
    // Check background color
    if (rules.backgroundColor && rules.backgroundColor.required) {
      // This would require actual image analysis
      result.warnings.push('Background color validation requires manual check');
    }
  }

  /**
   * Validate product shots collection
   */
  validateProductShots(shots, rules, result) {
    if (rules.minCount && shots.length < rules.minCount) {
      result.errors.push(`Insufficient product shots: ${shots.length}, minimum: ${rules.minCount}`);
      result.valid = false;
    }
  }

  /**
   * Generate export configuration from template
   */
  generateExportConfig(templateName, overrides = {}) {
    const template = this.getTemplate(templateName);
    
    return {
      template: templateName,
      images: this.generateImageConfigs(template.images),
      lighting: template.lighting,
      camera: template.camera,
      quality: template.quality,
      naming: template.naming,
      ...overrides
    };
  }

  /**
   * Generate image configurations from template
   */
  generateImageConfigs(imageTemplates) {
    const configs = [];
    
    Object.entries(imageTemplates).forEach(([type, settings]) => {
      if (settings.required || settings.count) {
        if (settings.count) {
          // Multiple images (like product shots)
          const count = settings.count.min || 6; // Default to 6 views
          
          for (let i = 0; i < count; i++) {
            configs.push({
              type,
              index: i,
              ...settings
            });
          }
        } else {
          // Single image
          configs.push({
            type,
            ...settings
          });
        }
      }
    });
    
    return configs;
  }

  /**
   * Get marketplace best practices
   */
  getBestPractices(templateName) {
    const practices = {
      turbosquid: [
        'Use RGB(247,247,247) background for search image',
        'Ensure search image is perfectly square (1:1 ratio)',
        'Include at least 5 product shot images',
        'Always include a wireframe view',
        'No overlays, borders, or watermarks on search image',
        'Use professional studio lighting',
        'Show model from all 6 orthographic views'
      ],
      
      cgtrader: [
        'Use 1.33:1 aspect ratio for main image',
        'Write 50-100 word description for 3x sales boost',
        'Include 10-15 relevant tags',
        'Use natural lighting for realistic appearance',
        'Show model in context or use environment',
        'Include detail shots of important features'
      ],
      
      sketchfab: [
        'Use dramatic lighting for visual impact',
        'Create hero shot showing best angle',
        'Include detail shots of textures/materials',
        'Use social media friendly 1.9:1 ratio',
        'Showcase unique features prominently'
      ]
    };
    
    return practices[templateName] || practices.turbosquid;
  }

  /**
   * Get template recommendations based on model type
   */
  getRecommendedTemplate(modelType) {
    const recommendations = {
      architecture: 'turbosquid',
      vehicle: 'turbosquid',
      character: 'cgtrader',
      furniture: 'turbosquid',
      weapon: 'cgtrader',
      environment: 'sketchfab',
      game_asset: 'unity',
      prop: 'cgtrader'
    };
    
    return recommendations[modelType] || 'turbosquid';
  }

  /**
   * Create custom template
   */
  createCustom(name, config) {
    this.templates[name] = {
      name,
      description: 'Custom user template',
      ...config,
      custom: true
    };
    
    return this.templates[name];
  }

  /**
   * Export template configuration
   */
  exportTemplate(templateName) {
    const template = this.getTemplate(templateName);
    
    return {
      ...template,
      exported: true,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Import template configuration
   */
  importTemplate(templateData) {
    if (templateData.name && templateData.exported) {
      this.templates[templateData.name] = templateData;
      return true;
    }
    
    return false;
  }
}
