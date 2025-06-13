/**
 * ControlPanel.js - Main Control Panel Interface
 * Manages all UI controls and settings
 */

export class ControlPanel {
  constructor(options = {}) {
    this.options = {
      onSettingChange: null,
      onAction: null,
      ...options
    };
    
    this.settings = {
      lighting: 'studio',
      background: 'turbosquid',
      quality: 'standard',
      marketplace: 'turbosquid',
      customColor: '#f7f7f7'
    };
    
    this.setupUI();
    this.setupEventListeners();
  }

  /**
   * Setup UI elements
   */
  setupUI() {
    // Lighting controls
    this.lightingPresets = document.querySelectorAll('.preset-btn');
    
    // Background controls
    this.backgroundOptions = document.querySelectorAll('.bg-btn');
    this.customColorPicker = document.getElementById('custom-color');
    
    // Quality and marketplace controls
    this.qualitySelect = document.getElementById('quality-preset');
    this.marketplaceSelect = document.getElementById('marketplace-preset');
    
    // Action buttons
    this.resetCameraBtn = document.getElementById('reset-camera');
    this.centerModelBtn = document.getElementById('center-model');
    this.autoFrameBtn = document.getElementById('auto-frame');
    this.exportAllBtn = document.getElementById('export-all');
    
    // Individual capture buttons
    this.captureButtons = document.querySelectorAll('.capture-btn');
    
    // Panel sections for collapsing
    this.panelSections = document.querySelectorAll('.panel-section');
    
    this.validateElements();
  }

  /**
   * Validate that required elements exist
   */
  validateElements() {
    const requiredElements = [
      this.qualitySelect,
      this.marketplaceSelect,
      this.exportAllBtn
    ];
    
    const missingElements = requiredElements.filter(el => !el);
    if (missingElements.length > 0) {
      console.warn('Some control panel elements are missing');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Lighting preset buttons
    this.lightingPresets.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.getAttribute('data-preset');
        this.setLightingPreset(preset);
      });
    });
    
    // Background option buttons
    this.backgroundOptions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const background = e.target.getAttribute('data-background');
        this.setBackground(background);
      });
    });
    
    // Custom color picker
    if (this.customColorPicker) {
      this.customColorPicker.addEventListener('change', (e) => {
        this.setCustomColor(e.target.value);
      });
    }
    
    // Quality selector
    if (this.qualitySelect) {
      this.qualitySelect.addEventListener('change', (e) => {
        this.setQuality(e.target.value);
      });
    }
    
    // Marketplace selector
    if (this.marketplaceSelect) {
      this.marketplaceSelect.addEventListener('change', (e) => {
        this.setMarketplace(e.target.value);
      });
    }
    
    // Action buttons
    if (this.resetCameraBtn) {
      this.resetCameraBtn.addEventListener('click', () => {
        this.triggerAction('reset');
      });
    }
    
    if (this.centerModelBtn) {
      this.centerModelBtn.addEventListener('click', () => {
        this.triggerAction('center');
      });
    }
    
    if (this.autoFrameBtn) {
      this.autoFrameBtn.addEventListener('click', () => {
        this.triggerAction('autoframe');
      });
    }
    
    if (this.exportAllBtn) {
      this.exportAllBtn.addEventListener('click', () => {
        this.triggerAction('export');
      });
    }
    
    // Individual capture buttons
    this.captureButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.getAttribute('data-view');
        this.triggerAction('capture', { view });
      });
    });
    
    // Panel section collapsing
    this.setupCollapsibleSections();
  }

  /**
   * Setup collapsible panel sections
   */
  setupCollapsibleSections() {
    this.panelSections.forEach(section => {
      const header = section.querySelector('h3');
      if (header) {
        header.addEventListener('click', () => {
          this.toggleSection(section);
        });
      }
    });
  }

  /**
   * Toggle panel section visibility
   */
  toggleSection(section) {
    section.classList.toggle('collapsed');
    
    const header = section.querySelector('h3');
    if (header) {
      const isCollapsed = section.classList.contains('collapsed');
      header.setAttribute('aria-expanded', !isCollapsed);
    }
  }

  /**
   * Set lighting preset
   */
  setLightingPreset(preset) {
    if (this.settings.lighting === preset) return;
    
    this.settings.lighting = preset;
    
    // Update UI
    this.lightingPresets.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === preset);
    });
    
    // Notify callback
    this.notifySettingChange('lighting', preset);
  }

  /**
   * Set background option
   */
  setBackground(background) {
    if (this.settings.background === background) return;
    
    this.settings.background = background;
    
    // Update UI
    this.backgroundOptions.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-background') === background);
    });
    
    // Show/hide custom color picker
    if (this.customColorPicker) {
      this.customColorPicker.style.display = background === 'custom' ? 'block' : 'none';
    }
    
    // Notify callback
    this.notifySettingChange('background', background);
  }

  /**
   * Set custom background color
   */
  setCustomColor(color) {
    this.settings.customColor = color;
    this.setBackground('custom');
    
    // Notify callback with custom color
    this.notifySettingChange('background', 'custom', color);
  }

  /**
   * Set quality preset
   */
  setQuality(quality) {
    if (this.settings.quality === quality) return;
    
    this.settings.quality = quality;
    
    // Update UI
    if (this.qualitySelect) {
      this.qualitySelect.value = quality;
    }
    
    // Notify callback
    this.notifySettingChange('quality', quality);
  }

  /**
   * Set marketplace preset
   */
  setMarketplace(marketplace) {
    if (this.settings.marketplace === marketplace) return;
    
    this.settings.marketplace = marketplace;
    
    // Update UI
    if (this.marketplaceSelect) {
      this.marketplaceSelect.value = marketplace;
    }
    
    // Update quality recommendation based on marketplace
    this.updateQualityRecommendation(marketplace);
    
    // Notify callback
    this.notifySettingChange('marketplace', marketplace);
  }

  /**
   * Update quality recommendation based on marketplace
   */
  updateQualityRecommendation(marketplace) {
    const recommendations = {
      turbosquid: 'high',
      cgtrader: 'standard',
      custom: 'standard'
    };
    
    const recommendedQuality = recommendations[marketplace];
    if (recommendedQuality && recommendedQuality !== this.settings.quality) {
      this.setQuality(recommendedQuality);
      this.showRecommendation(`Qualité recommandée pour ${marketplace}: ${recommendedQuality}`);
    }
  }

  /**
   * Show recommendation message
   */
  showRecommendation(message) {
    // Create or update recommendation tooltip
    const tooltip = this.createTooltip(message, 'recommendation');
    
    // Position near marketplace selector
    if (this.marketplaceSelect) {
      this.positionTooltip(tooltip, this.marketplaceSelect);
    }
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideTooltip(tooltip);
    }, 3000);
  }

  /**
   * Create tooltip element
   */
  createTooltip(message, type = 'info') {
    let tooltip = document.querySelector(`.tooltip-${type}`);
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = `tooltip tooltip-${type}`;
      document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = message;
    tooltip.style.display = 'block';
    
    return tooltip;
  }

  /**
   * Position tooltip relative to element
   */
  positionTooltip(tooltip, element) {
    const rect = element.getBoundingClientRect();
    tooltip.style.position = 'absolute';
    tooltip.style.top = (rect.bottom + 5) + 'px';
    tooltip.style.left = rect.left + 'px';
    tooltip.style.zIndex = '10000';
  }

  /**
   * Hide tooltip
   */
  hideTooltip(tooltip) {
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  /**
   * Trigger action callback
   */
  triggerAction(action, data = {}) {
    if (this.options.onAction) {
      this.options.onAction(action, data);
    }
  }

  /**
   * Notify setting change callback
   */
  notifySettingChange(setting, value, extra = null) {
    if (this.options.onSettingChange) {
      this.options.onSettingChange(setting, value, extra);
    }
  }

  /**
   * Enable/disable export button
   */
  setExportEnabled(enabled) {
    if (this.exportAllBtn) {
      this.exportAllBtn.disabled = !enabled;
      this.exportAllBtn.style.opacity = enabled ? '1' : '0.5';
    }
  }

  /**
   * Set export button loading state
   */
  setExportLoading(loading) {
    if (!this.exportAllBtn) return;
    
    if (loading) {
      this.exportAllBtn.disabled = true;
      this.exportAllBtn.innerHTML = '⏳ Export en cours...';
      this.exportAllBtn.classList.add('loading');
    } else {
      this.exportAllBtn.disabled = false;
      this.exportAllBtn.innerHTML = '🚀 Exporter Toutes les Vues';
      this.exportAllBtn.classList.remove('loading');
    }
  }

  /**
   * Update capture button states
   */
  setCaptureButtonStates(states) {
    this.captureButtons.forEach(btn => {
      const view = btn.getAttribute('data-view');
      const state = states[view];
      
      if (state) {
        btn.disabled = state.disabled || false;
        btn.classList.toggle('loading', state.loading || false);
        btn.classList.toggle('success', state.success || false);
        btn.classList.toggle('error', state.error || false);
      }
    });
  }

  /**
   * Add custom control element
   */
  addCustomControl(sectionId, element) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.appendChild(element);
    }
  }

  /**
   * Create slider control
   */
  createSlider(options = {}) {
    const {
      id,
      label,
      min = 0,
      max = 100,
      value = 50,
      step = 1,
      onChange
    } = options;
    
    const container = document.createElement('div');
    container.className = 'slider-control';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.htmlFor = id;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    slider.className = 'slider';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = value;
    
    slider.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      valueDisplay.textContent = newValue;
      
      if (onChange) {
        onChange(newValue);
      }
    });
    
    container.appendChild(labelElement);
    container.appendChild(slider);
    container.appendChild(valueDisplay);
    
    return container;
  }

  /**
   * Create toggle switch
   */
  createToggle(options = {}) {
    const {
      id,
      label,
      checked = false,
      onChange
    } = options;
    
    const container = document.createElement('div');
    container.className = 'toggle-control';
    
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = id;
    toggle.checked = checked;
    toggle.className = 'toggle';
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    labelElement.className = 'toggle-label';
    
    toggle.addEventListener('change', (e) => {
      if (onChange) {
        onChange(e.target.checked);
      }
    });
    
    container.appendChild(toggle);
    container.appendChild(labelElement);
    
    return container;
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Apply settings from object
   */
  applySettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
      switch (key) {
        case 'lighting':
          this.setLightingPreset(value);
          break;
        case 'background':
          this.setBackground(value);
          break;
        case 'quality':
          this.setQuality(value);
          break;
        case 'marketplace':
          this.setMarketplace(value);
          break;
        case 'customColor':
          if (this.customColorPicker) {
            this.customColorPicker.value = value;
          }
          this.settings.customColor = value;
          break;
      }
    });
  }

  /**
   * Reset all controls to default values
   */
  reset() {
    const defaultSettings = {
      lighting: 'studio',
      background: 'turbosquid',
      quality: 'standard',
      marketplace: 'turbosquid',
      customColor: '#f7f7f7'
    };
    
    this.applySettings(defaultSettings);
  }

  /**
   * Export current configuration
   */
  exportConfig() {
    return {
      settings: this.getSettings(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Import configuration
   */
  importConfig(config) {
    if (config && config.settings) {
      this.applySettings(config.settings);
      console.log('✅ Configuration imported');
    }
  }

  /**
   * Dispose of control panel
   */
  dispose() {
    // Remove event listeners
    this.lightingPresets.forEach(btn => {
      btn.removeEventListener('click', () => {});
    });
    
    this.backgroundOptions.forEach(btn => {
      btn.removeEventListener('click', () => {});
    });
    
    // Remove tooltips
    document.querySelectorAll('.tooltip').forEach(tooltip => {
      tooltip.remove();
    });
    
    console.log('🗑️ Control panel disposed');
  }
}
