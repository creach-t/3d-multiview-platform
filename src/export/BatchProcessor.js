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
      console.warn('Batch processing already in progress, resetting...');
      this.reset();
    }
    
    try {
      this.isProcessing = true;
      
      const results = await this.processSimpleExport(settings, template, options);
      
      this.updateStats(results);
      return results;
      
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.currentBatch = null;
    }
  }

  /**
   * Simple export process for immediate functionality
   */
  async processSimpleExport(settings, template, options) {
    console.log('Starting simple export...');
    
    const results = [];
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    // Export standard views
    for (const viewName of viewNames) {
      try {
        const result = await this.imageExporter.captureView(viewName, {
          format: 'image/png',
          quality: 0.95,
          marketplace: template.name || 'export'
        });
        
        results.push({
          success: true,
          viewName,
          data: result.imageData,
          filename: `${viewName}_view.png`
        });
        
        console.log(`✅ Captured view: ${viewName}`);
        
        // Small delay between captures
        await this.delay(100);
        
      } catch (error) {
        console.error(`❌ Failed to capture ${viewName}:`, error);
        results.push({
          success: false,
          viewName,
          error: error.message
        });
      }
    }
    
    // Add wireframe if required by template
    if (template.images?.wireframe?.required) {
      try {
        const wireframeResult = await this.imageExporter.captureWireframe('front');
        results.push({
          success: true,
          viewName: 'wireframe',
          data: wireframeResult.imageData,
          filename: 'wireframe_view.png'
        });
        console.log('✅ Captured wireframe view');
      } catch (error) {
        console.error('❌ Failed to capture wireframe:', error);
        results.push({
          success: false,
          viewName: 'wireframe',
          error: error.message
        });
      }
    }
    
    console.log(`Export completed: ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} failed`);
    
    return results;
  }

  /**
   * Create batch job configuration (legacy compatibility)
   */
  createBatchJob(settings, template, options) {
    return {
      id: this.generateBatchId(),
      timestamp: new Date().toISOString(),
      settings,
      template,
      options,
      jobs: []
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
   * Export batch results as ZIP data
   */
  async exportAsZip(results, options = {}) {
    // Simple ZIP data structure for manual download
    const zipData = {
      name: `export_${Date.now()}`,
      files: [],
      metadata: {
        exportDate: new Date().toISOString(),
        totalFiles: results.filter(r => r.success).length
      }
    };
    
    // Add successful exports to ZIP data
    results.forEach(item => {
      if (item.success && item.data) {
        zipData.files.push({
          name: item.filename || `${item.viewName}.png`,
          data: item.data,
          type: 'image',
          view: item.viewName
        });
      }
    });
    
    return zipData;
  }

  /**
   * Create export manifest
   */
  createExportManifest(results, template) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    return {
      version: '1.0.0',
      template: template.name,
      exportDate: new Date().toISOString(),
      statistics: {
        totalJobs: results.length,
        successfulJobs: successful.length,
        failedJobs: failed.length
      },
      files: successful.map(item => ({
        filename: item.filename,
        view: item.viewName,
        format: 'PNG'
      })),
      errors: failed.map(item => ({
        view: item.viewName,
        error: item.error
      }))
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
    
    const successful = results.filter(r => r.success);
    
    // Check minimum view count
    const viewCount = successful.filter(item => 
      ['front', 'back', 'left', 'right', 'top', 'bottom'].includes(item.viewName)
    ).length;
    
    if (viewCount < 6) {
      validation.warnings.push(`Only ${viewCount} views exported, recommended: 6`);
    }
    
    // Check wireframe if required
    if (template.images?.wireframe?.required) {
      const hasWireframe = successful.some(item => item.viewName === 'wireframe');
      if (!hasWireframe) {
        validation.errors.push('Missing required wireframe view');
        validation.valid = false;
      }
    }
    
    // Calculate completeness
    validation.completeness = (successful.length / results.length) * 100;
    
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
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    this.stats.totalJobs += results.length;
    this.stats.completedJobs += successful.length;
    this.stats.failedJobs += failed.length;
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
   * Get current batch progress
   */
  getCurrentProgress() {
    return {
      isProcessing: this.isProcessing,
      currentBatch: this.currentBatch
    };
  }

  /**
   * Cancel current batch
   */
  cancelBatch() {
    if (this.isProcessing) {
      this.reset();
      console.log('🛑 Batch cancelled');
      return true;
    }
    return false;
  }

  /**
   * Reset processor state
   */
  reset() {
    this.isProcessing = false;
    this.currentBatch = null;
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
    this.reset();
    this.progressCallback = null;
    this.errorCallback = null;
    
    console.log('🗑️ Batch processor disposed');
  }
}
