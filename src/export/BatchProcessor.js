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
      console.warn('Batch processing already in progress, waiting...');
      // Instead of throwing, wait for current process to finish
      await this.waitForCompletion();
    }
    
    this.isProcessing = true;
    this.currentBatch = this.createBatchJob(settings, template, options);
    
    try {
      console.log('🚀 Starting batch export...');
      
      const results = await this.processSimpleExport(settings, template, options);
      
      // Ensure results is always an array
      const resultsArray = Array.isArray(results) ? results : [];
      
      this.updateStats(resultsArray);
      
      console.log(`✅ Batch export completed: ${resultsArray.length} results`);
      return resultsArray;
      
    } catch (error) {
      console.error('❌ Batch export failed:', error);
      this.notifyError({ error: error.message, batch: this.currentBatch });
      
      // Return empty array on error to maintain consistency
      return [];
    } finally {
      // Always cleanup
      this.cleanup();
    }
  }

  /**
   * Wait for current processing to complete
   */
  async waitForCompletion() {
    const maxWait = 30000; // 30 seconds max wait
    const startTime = Date.now();
    
    while (this.isProcessing && (Date.now() - startTime) < maxWait) {
      await this.delay(100);
    }
    
    if (this.isProcessing) {
      console.warn('⚠️ Force stopping previous batch process');
      this.cleanup();
    }
  }

  /**
   * Simple export process for immediate functionality
   */
  async processSimpleExport(settings, template, options) {
    console.log('📸 Processing simple export...');
    
    if (!this.imageExporter) {
      throw new Error('ImageExporter not available');
    }
    
    const results = [];
    const viewNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    this.notifyProgress({
      stage: 'starting',
      total: viewNames.length,
      completed: 0
    });
    
    // Export standard views
    for (let i = 0; i < viewNames.length; i++) {
      const viewName = viewNames[i];
      
      try {
        console.log(`📷 Capturing view: ${viewName} (${i + 1}/${viewNames.length})`);
        
        const exportOptions = {
          format: 'image/png',
          quality: 0.95,
          marketplace: template?.name || 'export',
          ...options
        };
        
        const result = await this.imageExporter.captureView(viewName, exportOptions);
        
        if (result && result.imageData) {
          results.push({
            success: true,
            viewName,
            data: result.imageData,
            filename: result.filename || `${viewName}_view.png`,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Successfully captured: ${viewName}`);
        } else {
          throw new Error('No image data returned');
        }
        
        this.notifyProgress({
          stage: 'processing',
          total: viewNames.length,
          completed: i + 1,
          current: viewName
        });
        
        // Small delay between captures to prevent browser lockup
        await this.delay(150);
        
      } catch (error) {
        console.error(`❌ Failed to capture ${viewName}:`, error);
        results.push({
          success: false,
          viewName,
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        this.notifyError({
          viewName,
          error: error.message,
          stage: 'capture'
        });
      }
    }
    
    // Add wireframe if required by template
    if (template?.images?.wireframe?.required) {
      try {
        console.log('🔲 Capturing wireframe view...');
        const wireframeResult = await this.imageExporter.captureWireframe('front');
        
        if (wireframeResult && wireframeResult.imageData) {
          results.push({
            success: true,
            viewName: 'wireframe',
            data: wireframeResult.imageData,
            filename: wireframeResult.filename || 'wireframe_view.png',
            timestamp: new Date().toISOString()
          });
          console.log('✅ Successfully captured wireframe');
        }
      } catch (error) {
        console.error('❌ Failed to capture wireframe:', error);
        results.push({
          success: false,
          viewName: 'wireframe',
          error: error.message || 'Wireframe capture failed',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`📊 Export summary: ${successCount} success, ${failureCount} failures`);
    
    this.notifyProgress({
      stage: 'completed',
      total: results.length,
      completed: successCount,
      failed: failureCount
    });
    
    return results;
  }

  /**
   * Create batch job configuration
   */
  createBatchJob(settings, template, options) {
    return {
      id: this.generateBatchId(),
      timestamp: new Date().toISOString(),
      settings: { ...settings },
      template: { ...template },
      options: { ...options },
      status: 'running'
    };
  }

  /**
   * Generate batch ID
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate filename for export
   */
  generateFilename(view, template, resolution) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_');
    const marketplace = (template?.name || 'export').toLowerCase();
    const resStr = resolution ? `_${resolution.width}x${resolution.height}` : '';
    
    return `${marketplace}_${view}${resStr}_${timestamp}.png`;
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
    
    if (!Array.isArray(results)) {
      validation.valid = false;
      validation.errors.push('Results is not an array');
      return validation;
    }
    
    const successful = results.filter(r => r && r.success);
    
    // Check minimum view count
    const viewCount = successful.filter(item => 
      ['front', 'back', 'left', 'right', 'top', 'bottom'].includes(item.viewName)
    ).length;
    
    if (viewCount < 6) {
      validation.warnings.push(`Only ${viewCount} views exported, recommended: 6`);
    }
    
    // Check wireframe if required
    if (template?.images?.wireframe?.required) {
      const hasWireframe = successful.some(item => item.viewName === 'wireframe');
      if (!hasWireframe) {
        validation.errors.push('Missing required wireframe view');
        validation.valid = false;
      }
    }
    
    // Calculate completeness
    validation.completeness = results.length > 0 ? (successful.length / results.length) * 100 : 0;
    
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
    if (!Array.isArray(results)) return;
    
    const successful = results.filter(r => r && r.success);
    const failed = results.filter(r => r && !r.success);
    
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
    if (typeof this.progressCallback === 'function') {
      try {
        this.progressCallback(data);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    }
  }

  /**
   * Notify error
   */
  notifyError(data) {
    if (typeof this.errorCallback === 'function') {
      try {
        this.errorCallback(data);
      } catch (error) {
        console.error('Error callback error:', error);
      }
    }
  }

  /**
   * Get current batch progress
   */
  getCurrentProgress() {
    return {
      isProcessing: this.isProcessing,
      currentBatch: this.currentBatch ? { ...this.currentBatch } : null
    };
  }

  /**
   * Cancel current batch
   */
  cancelBatch() {
    if (this.isProcessing) {
      console.log('🛑 Cancelling batch...');
      this.cleanup();
      return true;
    }
    return false;
  }

  /**
   * Cleanup batch processor state
   */
  cleanup() {
    this.isProcessing = false;
    if (this.currentBatch) {
      this.currentBatch.status = 'completed';
      this.currentBatch = null;
    }
    console.log('🧹 Batch processor cleaned up');
  }

  /**
   * Reset processor state (hard reset)
   */
  reset() {
    this.cleanup();
    this.resetStats();
    console.log('🔄 Batch processor reset');
  }

  /**
   * Utility: Add delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if processor is available
   */
  isAvailable() {
    return !this.isProcessing && this.imageExporter !== null;
  }

  /**
   * Dispose of batch processor
   */
  dispose() {
    this.cleanup();
    this.progressCallback = null;
    this.errorCallback = null;
    this.imageExporter = null;
    this.templates = null;
    
    console.log('🗑️ Batch processor disposed');
  }
}
