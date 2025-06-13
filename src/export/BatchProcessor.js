/**
 * BatchProcessor.js - Batch Export Processing System
 * Handles bulk export operations with progress tracking and optimization
 */

export class BatchProcessor {
  constructor(imageExporter, templates) {
    this.imageExporter = imageExporter;
    this.templates = templates;
    
    this.isProcessing = false;
    this.currentBatch = null;
    this.progressCallback = null;
    this.errorCallback = null;
    
    // Processing statistics
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalTime: 0,
      averageTime: 0
    };
  }

  /**
   * Export all views for a specific marketplace
   */
  async exportAll(settings, template, options = {}) {
    if (this.isProcessing) {
      throw new Error('Batch processing already in progress');
    }
    
    try {
      this.isProcessing = true;
      this.currentBatch = this.createBatchJob(settings, template, options);
      
      const results = await this.processBatch(this.currentBatch);
      
      this.updateStats(results);
      return results;
      
    } finally {
      this.isProcessing = false;
      this.currentBatch = null;
    }
  }

  /**
   * Create batch job configuration
   */
  createBatchJob(settings, template, options) {
    const batchJob = {
      id: this.generateBatchId(),
      timestamp: new Date().toISOString(),
      settings,
      template,
      options,
      jobs: []
    };
    
    // Generate individual export jobs based on template
    const exportConfig = this.templates.generateExportConfig(template.name || 'turbosquid');
    
    // Create search image job (TurboSquid requirement)
    if (template.images?.searchImage?.required) {
      batchJob.jobs.push(this.createSearchImageJob(template, settings));
    }
    
    // Create standard 6-view jobs
    const views = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    views.forEach(view => {
      batchJob.jobs.push(this.createViewJob(view, template, settings));
    });
    
    // Create wireframe job if required
    if (template.images?.wireframe?.required) {
      batchJob.jobs.push(this.createWireframeJob(template, settings));
    }
    
    // Create turntable job if required
    if (template.images?.turntable?.required) {
      batchJob.jobs.push(this.createTurntableJob(template, settings));
    }
    
    // Create contact sheet job if requested
    if (options.includeContactSheet) {
      batchJob.jobs.push(this.createContactSheetJob(template, settings));
    }
    
    return batchJob;
  }

  /**
   * Create search image job (square format for TurboSquid)
   */
  createSearchImageJob(template, settings) {
    const searchConfig = template.images.searchImage;
    
    return {
      id: this.generateJobId(),
      type: 'search_image',
      view: 'front', // Use front view for search image
      options: {
        resolution: searchConfig.resolution,
        format: searchConfig.format,
        quality: searchConfig.quality,
        background: searchConfig.background,
        marketplace: template.name,
        filename: this.generateFilename('search', template, searchConfig.resolution)
      },
      priority: 1, // High priority
      estimatedTime: 3000 // ms
    };
  }

  /**
   * Create standard view job
   */
  createViewJob(view, template, settings) {
    const productConfig = template.images.productShots || template.images.main;
    
    return {
      id: this.generateJobId(),
      type: 'view',
      view,
      options: {
        resolution: productConfig.resolution,
        format: productConfig.format,
        quality: productConfig.quality,
        background: productConfig.background || settings.background,
        marketplace: template.name,
        filename: this.generateFilename(view, template, productConfig.resolution)
      },
      priority: 2,
      estimatedTime: 2000
    };
  }

  /**
   * Create wireframe job
   */
  createWireframeJob(template, settings) {
    const wireframeConfig = template.images.wireframe;
    
    return {
      id: this.generateJobId(),
      type: 'wireframe',
      view: 'front',
      options: {
        resolution: wireframeConfig.resolution,
        format: wireframeConfig.format,
        quality: wireframeConfig.quality,
        background: wireframeConfig.background,
        wireframe: true,
        shadows: false,
        marketplace: template.name,
        filename: this.generateFilename('wireframe', template, wireframeConfig.resolution)
      },
      priority: 3,
      estimatedTime: 2500
    };
  }

  /**
   * Create turntable job
   */
  createTurntableJob(template, settings) {
    const turntableConfig = template.images.turntable;
    
    return {
      id: this.generateJobId(),
      type: 'turntable',
      view: 'front',
      options: {
        frames: turntableConfig.frames?.min || 24,
        resolution: turntableConfig.resolution,
        format: turntableConfig.format,
        quality: turntableConfig.quality,
        marketplace: template.name,
        filename: 'turntable_sequence'
      },
      priority: 4,
      estimatedTime: 30000 // Longer for animation
    };
  }

  /**
   * Create contact sheet job
   */
  createContactSheetJob(template, settings) {
    return {
      id: this.generateJobId(),
      type: 'contact_sheet',
      view: 'all',
      options: {
        resolution: { width: 3840, height: 2560 },
        format: 'image/png',
        quality: 0.95,
        marketplace: template.name,
        filename: this.generateFilename('contact_sheet', template, { width: 3840, height: 2560 })
      },
      priority: 5,
      estimatedTime: 8000
    };
  }

  /**
   * Process entire batch
   */
  async processBatch(batch) {
    const results = {
      batchId: batch.id,
      success: [],
      errors: [],
      totalJobs: batch.jobs.length,
      completedJobs: 0,
      startTime: Date.now(),
      endTime: null
    };
    
    this.notifyProgress({
      type: 'batch_start',
      batchId: batch.id,
      totalJobs: batch.jobs.length
    });
    
    // Sort jobs by priority
    const sortedJobs = batch.jobs.sort((a, b) => a.priority - b.priority);
    
    // Process jobs sequentially to avoid overwhelming the system
    for (let i = 0; i < sortedJobs.length; i++) {
      const job = sortedJobs[i];
      
      try {
        this.notifyProgress({
          type: 'job_start',
          jobId: job.id,
          jobType: job.type,
          view: job.view,
          progress: (i / sortedJobs.length) * 100
        });
        
        const result = await this.processJob(job);
        
        results.success.push({
          jobId: job.id,
          type: job.type,
          view: job.view,
          result,
          processingTime: result.processingTime
        });
        
        results.completedJobs++;
        
        this.notifyProgress({
          type: 'job_complete',
          jobId: job.id,
          progress: ((i + 1) / sortedJobs.length) * 100
        });
        
        // Small delay between jobs to prevent UI blocking
        await this.delay(100);
        
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        
        results.errors.push({
          jobId: job.id,
          type: job.type,
          view: job.view,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        this.notifyError({
          jobId: job.id,
          error: error.message
        });
      }
    }
    
    results.endTime = Date.now();
    results.totalTime = results.endTime - results.startTime;
    
    this.notifyProgress({
      type: 'batch_complete',
      batchId: batch.id,
      results
    });
    
    return results;
  }

  /**
   * Process individual job
   */
  async processJob(job) {
    const startTime = Date.now();
    
    let result;
    
    switch (job.type) {
      case 'search_image':
      case 'view':
        result = await this.imageExporter.captureView(job.view, job.options);
        break;
        
      case 'wireframe':
        result = await this.imageExporter.captureWireframe(job.view, job.options);
        break;
        
      case 'turntable':
        result = await this.imageExporter.captureTurntable(job.options);
        break;
        
      case 'contact_sheet':
        result = await this.imageExporter.createContactSheet(job.options);
        break;
        
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      ...result,
      processingTime,
      filename: job.options.filename
    };
  }

  /**
   * Generate batch ID
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate job ID
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate filename for export
   */
  generateFilename(view, template, resolution) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_');
    const marketplace = (template.name || 'export').toLowerCase();
    const resStr = resolution ? `_${resolution.width}x${resolution.height}` : '';
    
    return `${marketplace}_${view}${resStr}_${timestamp}`;
  }

  /**
   * Export batch results as ZIP
   */
  async exportAsZip(results, options = {}) {
    // This would require a ZIP library like JSZip
    // For now, we'll prepare data for manual ZIP creation
    
    const zipData = {
      name: `export_${results.batchId}`,
      files: [],
      metadata: {
        batchId: results.batchId,
        totalFiles: results.success.length,
        exportDate: new Date().toISOString(),
        template: this.currentBatch?.template?.name || 'unknown'
      }
    };
    
    // Add successful exports to ZIP data
    results.success.forEach(item => {
      if (item.result && item.result.imageData) {
        zipData.files.push({
          name: `${item.result.filename || item.view}.png`,
          data: item.result.imageData,
          type: item.type,
          view: item.view
        });
      }
    });
    
    // Add metadata file
    zipData.files.push({
      name: 'export_metadata.json',
      data: JSON.stringify(zipData.metadata, null, 2),
      type: 'metadata'
    });
    
    return zipData;
  }

  /**
   * Create export manifest
   */
  createExportManifest(results, template) {
    return {
      version: '1.0.0',
      batchId: results.batchId,
      template: template.name,
      exportDate: new Date().toISOString(),
      statistics: {
        totalJobs: results.totalJobs,
        successfulJobs: results.success.length,
        failedJobs: results.errors.length,
        totalProcessingTime: results.totalTime,
        averageJobTime: results.totalTime / results.totalJobs
      },
      files: results.success.map(item => ({
        filename: item.result.filename,
        type: item.type,
        view: item.view,
        resolution: item.result.resolution,
        format: item.result.format,
        processingTime: item.processingTime
      })),
      errors: results.errors,
      validation: this.validateBatchResults(results, template)
    };
  }

  /**
   * Validate batch results against template requirements
   */
  validateBatchResults(results, template) {
    const validation = {
      valid: true,
      warnings: [],
      errors: [],
      completeness: 0
    };
    
    const requiredTypes = [];
    
    // Check required image types
    if (template.images?.searchImage?.required) {
      requiredTypes.push('search_image');
    }
    
    if (template.images?.wireframe?.required) {
      requiredTypes.push('wireframe');
    }
    
    // Check if all required types were successfully exported
    requiredTypes.forEach(type => {
      const hasType = results.success.some(item => item.type === type);
      if (!hasType) {
        validation.errors.push(`Missing required ${type}`);
        validation.valid = false;
      }
    });
    
    // Check minimum view count
    const viewCount = results.success.filter(item => item.type === 'view').length;
    const minViews = template.images?.productShots?.count?.min || 6;
    
    if (viewCount < minViews) {
      validation.warnings.push(`Only ${viewCount} views exported, recommended: ${minViews}`);
    }
    
    // Calculate completeness
    validation.completeness = (results.success.length / results.totalJobs) * 100;
    
    return validation;
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalTime: 0,
      averageTime: 0
    };
  }

  /**
   * Update statistics
   */
  updateStats(results) {
    this.stats.totalJobs += results.totalJobs;
    this.stats.completedJobs += results.success.length;
    this.stats.failedJobs += results.errors.length;
    this.stats.totalTime += results.totalTime;
    this.stats.averageTime = this.stats.totalTime / this.stats.totalJobs;
  }

  /**
   * Set progress callback
   */
  onProgress(callback) {
    this.progressCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback) {
    this.errorCallback = callback;
  }

  /**
   * Notify progress
   */
  notifyProgress(data) {
    if (this.progressCallback) {
      this.progressCallback(data);
    }
  }

  /**
   * Notify error
   */
  notifyError(data) {
    if (this.errorCallback) {
      this.errorCallback(data);
    }
  }

  /**
   * Estimate batch processing time
   */
  estimateBatchTime(batch) {
    return batch.jobs.reduce((total, job) => total + job.estimatedTime, 0);
  }

  /**
   * Get current batch progress
   */
  getCurrentProgress() {
    if (!this.currentBatch) {
      return null;
    }
    
    return {
      batchId: this.currentBatch.id,
      isProcessing: this.isProcessing,
      totalJobs: this.currentBatch.jobs.length,
      estimatedTime: this.estimateBatchTime(this.currentBatch)
    };
  }

  /**
   * Cancel current batch (if possible)
   */
  cancelBatch() {
    if (this.isProcessing && this.currentBatch) {
      // This would need to be implemented with proper cancellation tokens
      console.warn('Batch cancellation not yet implemented');
      return false;
    }
    
    return true;
  }

  /**
   * Utility: Add delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose of batch processor
   */
  dispose() {
    this.isProcessing = false;
    this.currentBatch = null;
    this.progressCallback = null;
    this.errorCallback = null;
    
    console.log('🗑️ Batch processor disposed');
  }
}
