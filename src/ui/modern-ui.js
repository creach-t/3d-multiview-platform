/**
 * Modern UI Manager
 * Handles all the new UI interactions and animations
 */

class ModernUIManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.animations = new Map();
        this.toasts = [];
        this.init();
    }

    init() {
        this.initTheme();
        this.initAnimations();
        this.initInteractions();
        this.initToastSystem();
        this.initKeyboardNavigation();
        this.initAccessibility();
        console.log('🎨 Modern UI Manager initialized');
    }

    /**
     * Theme Management
     */
    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;
        
        // Set initial theme
        body.className = `theme-${this.theme}`;
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(this.theme);
    }

    setTheme(theme) {
        this.theme = theme;
        document.body.className = `theme-${theme}`;
        localStorage.setItem('theme', theme);
        
        // Animate theme transition
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);

        this.showToast(`${theme === 'dark' ? '🌙' : '☀️'} ${theme.charAt(0).toUpperCase() + theme.slice(1)} mode activated`);
    }

    /**
     * Animation System
     */
    initAnimations() {
        // Stagger animations for cards
        this.staggerAnimation('.control-card', {
            delay: 100,
            animation: 'fadeInUp 0.6s ease-out forwards'
        });

        // Parallax effect for background orbs
        this.initParallax();
        
        // Loading animations
        this.initLoadingAnimations();
    }

    staggerAnimation(selector, options = {}) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, (options.delay || 100) * index);
        });
    }

    initParallax() {
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.gradient-orb');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.1 + (index * 0.05);
                const yPos = -(scrolled * speed);
                element.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
            
            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick);
    }

    initLoadingAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.viewport, .control-card').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Interactive Elements
     */
    initInteractions() {
        this.initFileUpload();
        this.initButtons();
        this.initViewportControls();
        this.initProgressRings();
    }

    initFileUpload() {
        const uploadZone = document.getElementById('file-upload-zone');
        const fileInput = document.getElementById('file-input');
        const fileSelectBtn = document.getElementById('file-select-btn');

        if (!uploadZone || !fileInput) return;

        // Enhanced drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.add('drag-over');
                this.addRippleEffect(uploadZone);
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.remove('drag-over');
            }, false);
        });

        uploadZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelect(files);
        });

        if (fileSelectBtn) {
            fileSelectBtn.addEventListener('click', () => fileInput.click());
        }

        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });
    }

    initButtons() {
        // Add ripple effect to all buttons
        document.querySelectorAll('.preset-btn, .bg-option, .control-btn, .export-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.addRippleEffect(button, e);
            });
        });

        // Enhanced export button
        const exportBtn = document.getElementById('export-all');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.animateExport();
            });
        }
    }

    initViewportControls() {
        const syncBtn = document.getElementById('sync-cameras');
        const fullscreenBtn = document.getElementById('fullscreen-toggle');
        const viewportContainer = document.querySelector('.viewport-container');

        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                syncBtn.classList.toggle('active');
                this.toggleCameraSync(syncBtn.classList.contains('active'));
            });
        }

        if (fullscreenBtn && viewportContainer) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen(viewportContainer);
            });
        }

        // Viewport hover effects
        document.querySelectorAll('.viewport').forEach(viewport => {
            viewport.addEventListener('mouseenter', () => {
                this.animateViewport(viewport, 'enter');
            });
            
            viewport.addEventListener('mouseleave', () => {
                this.animateViewport(viewport, 'leave');
            });
        });
    }

    initProgressRings() {
        document.querySelectorAll('.progress-ring').forEach(ring => {
            this.updateProgressRing(ring, 0);
        });
    }

    /**
     * Toast Notification System
     */
    initToastSystem() {
        this.toastContainer = document.getElementById('toast-container');
        if (!this.toastContainer) {
            this.createToastContainer();
        }
    }

    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }

    showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        `;

        this.toastContainer.appendChild(toast);
        lucide.createIcons();

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        this.toasts.push(toast);
        return toast;
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    /**
     * Accessibility & Keyboard Navigation
     */
    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Theme toggle with Ctrl+Shift+T
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }

            // Export with Ctrl+E
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                const exportBtn = document.getElementById('export-all');
                if (exportBtn && !exportBtn.disabled) {
                    exportBtn.click();
                }
            }

            // Focus viewport with number keys
            if (e.key >= '1' && e.key <= '6') {
                const viewportIndex = parseInt(e.key) - 1;
                const viewports = document.querySelectorAll('.viewport');
                if (viewports[viewportIndex]) {
                    viewports[viewportIndex].focus();
                    this.highlightViewport(viewports[viewportIndex]);
                }
            }
        });
    }

    initAccessibility() {
        // Add ARIA labels
        document.querySelectorAll('.capture-btn').forEach((btn, index) => {
            btn.setAttribute('aria-label', `Capture view ${index + 1}`);
        });

        // Focus management
        this.setupFocusTraps();
        
        // Reduced motion respect
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduce-motion');
        }
    }

    setupFocusTraps() {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach(modal => {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                lastElement.focus();
                                e.preventDefault();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                firstElement.focus();
                                e.preventDefault();
                            }
                        }
                    }
                });
            }
        });
    }

    /**
     * Animation Helpers
     */
    addRippleEffect(element, event = null) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        if (event) {
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
        }

        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    animateViewport(viewport, action) {
        if (action === 'enter') {
            viewport.style.transform = 'translateY(-4px) scale(1.02)';
            viewport.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        } else {
            viewport.style.transform = '';
            viewport.style.boxShadow = '';
        }
    }

    animateExport() {
        const exportBtn = document.getElementById('export-all');
        if (!exportBtn) return;

        exportBtn.classList.add('btn-loading');
        exportBtn.disabled = true;

        // Simulate export progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                setTimeout(() => {
                    exportBtn.classList.remove('btn-loading');
                    exportBtn.disabled = false;
                    this.showToast('🚀 Export completed successfully!');
                }, 500);
            }
            
            this.updateProgressIndicators(progress);
        }, 200);
    }

    updateProgressIndicators(progress) {
        document.querySelectorAll('.progress-fill').forEach(fill => {
            fill.style.width = `${progress}%`;
        });
        
        document.querySelectorAll('.progress-text').forEach(text => {
            text.textContent = `${Math.round(progress)}%`;
        });
    }

    updateProgressRing(ring, progress) {
        const fill = ring.querySelector('.progress-ring-fill');
        const text = ring.querySelector('.progress-text');
        
        if (fill) {
            const rotation = (progress / 100) * 360;
            fill.style.transform = `rotate(${rotation - 90}deg)`;
        }
        
        if (text) {
            text.textContent = `${Math.round(progress)}%`;
        }
    }

    highlightViewport(viewport) {
        // Remove previous highlights
        document.querySelectorAll('.viewport.active').forEach(v => {
            v.classList.remove('active');
        });
        
        // Add highlight
        viewport.classList.add('active');
        
        setTimeout(() => {
            viewport.classList.remove('active');
        }, 2000);
    }

    toggleCameraSync(enabled) {
        const viewports = document.querySelectorAll('.viewport');
        viewports.forEach(viewport => {
            if (enabled) {
                viewport.classList.add('synced');
            } else {
                viewport.classList.remove('synced');
            }
        });

        this.showToast(
            enabled ? '🔗 Camera sync enabled' : '🔓 Camera sync disabled',
            'info'
        );
    }

    toggleFullscreen(container) {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            container.classList.remove('fullscreen');
            this.showToast('📱 Exited fullscreen mode');
        } else {
            container.requestFullscreen();
            container.classList.add('fullscreen');
            this.showToast('🖥️ Entered fullscreen mode');
        }
    }

    /**
     * Utility Methods
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileSelect(files) {
        if (files.length > 0) {
            const file = files[0];
            this.showFileInfo(file);
            this.showToast(`📁 File "${file.name}" loaded successfully!`);
        }
    }

    showFileInfo(file) {
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        
        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            fileInfo.classList.remove('hidden');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Public API
     */
    setStatus(status, type = 'info') {
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        
        if (statusText) statusText.textContent = status;
        if (statusDot) {
            statusDot.className = `status-dot ${type}`;
        }
    }

    showLoadingOverlay(text = 'Processing...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingText) loadingText.textContent = text;
        if (overlay) overlay.classList.remove('hidden');
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }
}

// Add CSS for new animations
const additionalCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
}

@keyframes slideOutRight {
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Initialize the modern UI manager
let modernUI;
document.addEventListener('DOMContentLoaded', () => {
    modernUI = new ModernUIManager();
});

// Export for global access
window.ModernUI = ModernUIManager;