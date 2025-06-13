/**
 * FileUploader.js - Drag & Drop File Upload Interface
 * Handles file selection, validation, and upload progress
 */

export class FileUploader {
  constructor(options = {}) {
    this.options = {
      acceptedTypes: ['.glb', '.gltf'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      onFileSelected: null,
      onError: null,
      onProgress: null,
      ...options
    };
    
    this.isUploading = false;
    this.setupUI();
    this.setupEventListeners();
  }

  /**
   * Setup UI elements
   */
  setupUI() {
    this.uploadZone = document.getElementById('file-upload-zone');
    this.fileInput = document.getElementById('file-input');
    this.fileSelectBtn = document.getElementById('file-select-btn');
    this.fileInfo = document.getElementById('file-info');
    this.fileName = document.getElementById('file-name');
    this.fileSize = document.getElementById('file-size');
    
    if (!this.uploadZone || !this.fileInput) {
      throw new Error('Required upload elements not found');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Drag and drop events
    this.uploadZone.addEventListener('dragover', (e) => this.onDragOver(e));
    this.uploadZone.addEventListener('dragleave', (e) => this.onDragLeave(e));
    this.uploadZone.addEventListener('drop', (e) => this.onDrop(e));
    this.uploadZone.addEventListener('click', () => this.openFileDialog());
    
    // File input events
    this.fileInput.addEventListener('change', (e) => this.onFileSelected(e));
    
    // File select button
    if (this.fileSelectBtn) {
      this.fileSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openFileDialog();
      });
    }
    
    // Prevent default drag behavior on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }

  /**
   * Handle drag over event
   */
  onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.uploadZone.classList.add('drag-over');
    
    // Set the dropEffect to show it's a valid drop target
    event.dataTransfer.dropEffect = 'copy';
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Only remove the class if we're leaving the upload zone completely
    if (!this.uploadZone.contains(event.relatedTarget)) {
      this.uploadZone.classList.remove('drag-over');
    }
  }

  /**
   * Handle drop event
   */
  onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.uploadZone.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    
    if (files.length === 0) {
      this.showError('Aucun fichier détecté');
      return;
    }
    
    if (files.length > 1) {
      this.showError('Veuillez sélectionner un seul fichier');
      return;
    }
    
    this.processFile(files[0]);
  }

  /**
   * Handle file input change
   */
  onFileSelected(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    this.processFile(files[0]);
  }

  /**
   * Open file dialog
   */
  openFileDialog() {
    if (this.isUploading) return;
    
    this.fileInput.click();
  }

  /**
   * Process selected file
   */
  async processFile(file) {
    if (this.isUploading) {
      this.showError('Un fichier est déjà en cours de traitement');
      return;
    }
    
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.showError(validation.error);
      return;
    }
    
    try {
      this.isUploading = true;
      this.showProgress(0);
      this.updateFileInfo(file);
      
      // Simulate upload progress for large files
      if (file.size > 10 * 1024 * 1024) { // 10MB
        await this.simulateProgress();
      }
      
      // Notify callback
      if (this.options.onFileSelected) {
        await this.options.onFileSelected(file);
      }
      
      this.showProgress(100);
      this.showSuccess(`Fichier "${file.name}" chargé avec succès`);
      
    } catch (error) {
      this.showError(`Erreur lors du chargement: ${error.message}`);
    } finally {
      this.isUploading = false;
      this.hideProgress();
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file) {
    // Check file type
    const fileName = file.name.toLowerCase();
    const isValidType = this.options.acceptedTypes.some(type => 
      fileName.endsWith(type.toLowerCase())
    );
    
    if (!isValidType) {
      return {
        valid: false,
        error: `Type de fichier non supporté. Types acceptés: ${this.options.acceptedTypes.join(', ')}`
      };
    }
    
    // Check file size
    if (file.size > this.options.maxFileSize) {
      const maxSizeMB = Math.round(this.options.maxFileSize / (1024 * 1024));
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB`
      };
    }
    
    // Check if file is not empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'Le fichier est vide'
      };
    }
    
    return { valid: true };
  }

  /**
   * Update file information display
   */
  updateFileInfo(file) {
    if (!this.fileInfo || !this.fileName || !this.fileSize) return;
    
    this.fileName.textContent = file.name;
    this.fileSize.textContent = this.formatFileSize(file.size);
    this.fileInfo.classList.remove('hidden');
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Simulate upload progress for large files
   */
  async simulateProgress() {
    const steps = 20;
    const stepDelay = 50; // milliseconds
    
    for (let i = 1; i <= steps; i++) {
      const progress = Math.floor((i / steps) * 90); // Up to 90%
      this.showProgress(progress);
      
      if (this.options.onProgress) {
        this.options.onProgress(progress);
      }
      
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }
  }

  /**
   * Show upload progress
   */
  showProgress(percentage) {
    let progressBar = this.uploadZone.querySelector('.upload-progress-bar');
    let progressContainer = this.uploadZone.querySelector('.upload-progress');
    
    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.className = 'upload-progress';
      progressContainer.innerHTML = '<div class="upload-progress-bar"></div>';
      this.uploadZone.appendChild(progressContainer);
      progressBar = progressContainer.querySelector('.upload-progress-bar');
    }
    
    progressBar.style.width = `${percentage}%`;
    progressContainer.style.display = 'block';
  }

  /**
   * Hide upload progress
   */
  hideProgress() {
    const progressContainer = this.uploadZone.querySelector('.upload-progress');
    if (progressContainer) {
      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 1000); // Hide after 1 second
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('File upload error:', message);
    
    if (this.options.onError) {
      this.options.onError(message);
    }
    
    // Visual feedback
    this.uploadZone.classList.add('error');
    setTimeout(() => {
      this.uploadZone.classList.remove('error');
    }, 3000);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    console.log('File upload success:', message);
    
    // Visual feedback
    this.uploadZone.classList.add('success');
    setTimeout(() => {
      this.uploadZone.classList.remove('success');
    }, 2000);
  }

  /**
   * Reset file input
   */
  reset() {
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    
    if (this.fileInfo) {
      this.fileInfo.classList.add('hidden');
    }
    
    this.hideProgress();
    this.uploadZone.classList.remove('drag-over', 'error', 'success');
    this.isUploading = false;
  }

  /**
   * Set accepted file types
   */
  setAcceptedTypes(types) {
    this.options.acceptedTypes = types;
    
    // Update file input accept attribute
    if (this.fileInput) {
      this.fileInput.accept = types.join(',');
    }
  }

  /**
   * Set maximum file size
   */
  setMaxFileSize(sizeInBytes) {
    this.options.maxFileSize = sizeInBytes;
  }

  /**
   * Enable/disable the uploader
   */
  setEnabled(enabled) {
    if (enabled) {
      this.uploadZone.classList.remove('disabled');
      this.uploadZone.style.pointerEvents = 'auto';
    } else {
      this.uploadZone.classList.add('disabled');
      this.uploadZone.style.pointerEvents = 'none';
    }
  }

  /**
   * Get current upload state
   */
  getState() {
    return {
      isUploading: this.isUploading,
      acceptedTypes: this.options.acceptedTypes,
      maxFileSize: this.options.maxFileSize
    };
  }

  /**
   * Add custom validation function
   */
  addValidator(validatorFn) {
    const originalValidate = this.validateFile.bind(this);
    
    this.validateFile = (file) => {
      const baseValidation = originalValidate(file);
      if (!baseValidation.valid) {
        return baseValidation;
      }
      
      return validatorFn(file);
    };
  }

  /**
   * Read file as different formats
   */
  async readFile(file, format = 'arrayBuffer') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      
      switch (format) {
        case 'text':
          reader.readAsText(file);
          break;
        case 'dataURL':
          reader.readAsDataURL(file);
          break;
        case 'arrayBuffer':
        default:
          reader.readAsArrayBuffer(file);
          break;
      }
    });
  }

  /**
   * Dispose of the uploader
   */
  dispose() {
    // Remove event listeners
    if (this.uploadZone) {
      this.uploadZone.removeEventListener('dragover', this.onDragOver);
      this.uploadZone.removeEventListener('dragleave', this.onDragLeave);
      this.uploadZone.removeEventListener('drop', this.onDrop);
      this.uploadZone.removeEventListener('click', this.openFileDialog);
    }
    
    if (this.fileInput) {
      this.fileInput.removeEventListener('change', this.onFileSelected);
    }
    
    if (this.fileSelectBtn) {
      this.fileSelectBtn.removeEventListener('click', this.openFileDialog);
    }
    
    document.removeEventListener('dragover', (e) => e.preventDefault());
    document.removeEventListener('drop', (e) => e.preventDefault());
    
    // Reset state
    this.reset();
    
    console.log('🗑️ File uploader disposed');
  }
}
