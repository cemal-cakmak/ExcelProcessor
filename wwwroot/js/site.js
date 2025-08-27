// Site-wide JavaScript functionality

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    // Bootstrap tooltip initialization
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// File input styling and validation
function validateFileInput(input) {
    const file = input.files[0];
    if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            alert('Sadece Excel dosyaları (.xlsx, .xls) desteklenir.');
            input.value = '';
            return false;
        }
        
        // Show file name
        const fileName = file.name;
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.textContent = fileName;
        }
    }
    return true;
}

// Loading states for buttons
function setButtonLoading(buttonId, isLoading, originalText = '') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Yükleniyor...';
        button.disabled = true;
    } else {
        const originalContent = button.getAttribute('data-original-text') || originalText;
        button.innerHTML = originalContent;
        button.disabled = false;
        button.removeAttribute('data-original-text');
    }
}

// Smooth scrolling to elements
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Copy to clipboard functionality
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
    }
}

// Show success/error messages
function showMessage(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container-fluid main');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}
