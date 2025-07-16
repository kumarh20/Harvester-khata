// Global variables
let records = [];
let filteredRecords = [];
let selectedPeriod = 'all';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeLucide();
    loadRecords();
    setupEventListeners();
    setCurrentDate();
    updateCalculations();
    
    // Add loading state management
    document.body.classList.remove('loading');
});

// Initialize Lucide icons
function initializeLucide() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Format date from YYYY-MM-DD to DD/MM/YYYY for display
function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}

// Format date from DD/MM/YYYY to YYYY-MM-DD for input
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation with improved UX
    document.querySelectorAll('.premium-tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(button.dataset.tab);
        });
        
        // Add keyboard navigation
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchTab(button.dataset.tab);
            }
        });
    });

    // Form inputs with enhanced feedback
    const landInput = document.getElementById('landInAcres');
    const rateInput = document.getElementById('ratePerAcre');
    const nakadInput = document.getElementById('nakadPaid');
    
    landInput.addEventListener('input', debounce(updateCalculations, 300));
    rateInput.addEventListener('input', debounce(updateCalculations, 300));
    nakadInput.addEventListener('input', debounce(updateCalculations, 300));
    
    // Add input validation feedback
    landInput.addEventListener('blur', validateLandInput);
    rateInput.addEventListener('blur', validateRateInput);
    nakadInput.addEventListener('blur', validateNakadInput);

    // Form submission with loading state
    document.getElementById('entryForm').addEventListener('submit', handleFormSubmit);

    // Enhanced search with debouncing
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));

    // Period selector with keyboard support
    document.querySelectorAll('.period-button').forEach(button => {
        button.addEventListener('click', () => selectPeriod(button.dataset.period));
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectPeriod(button.dataset.period);
            }
        });
    });

    // Contact number validation with real-time feedback
    const contactInput = document.getElementById('contactNumber');
    contactInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        validateContactNumber(e.target);
    });

    // Add smooth scrolling for better UX
    document.querySelectorAll('.premium-tab-button').forEach(button => {
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Debounce function for better performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Input validation functions
function validateLandInput(e) {
    const value = parseFloat(e.target.value);
    
    if (value <= 0 && e.target.value !== '') {
        e.target.style.borderColor = 'var(--error-500)';
        showInputError(e.target, 'कृपया वैध ज़मीन का क्षेत्रफल दर्ज करें');
    } else {
        e.target.style.borderColor = '';
        hideInputError(e.target);
    }
}

function validateRateInput(e) {
    const value = parseFloat(e.target.value);
    
    if (value <= 0 && e.target.value !== '') {
        e.target.style.borderColor = 'var(--error-500)';
        showInputError(e.target, 'कृपया वैध दर दर्ज करें');
    } else {
        e.target.style.borderColor = '';
        hideInputError(e.target);
    }
}

function validateNakadInput(e) {
    const nakadValue = parseFloat(e.target.value) || 0;
    const totalValue = parseFloat(document.getElementById('totalPayment').textContent.replace(/[₹,]/g, '')) || 0;
    
    if (nakadValue > totalValue && e.target.value !== '') {
        e.target.style.borderColor = 'var(--error-500)';
        showInputError(e.target, 'नकद राशि कुल राशि से अधिक नहीं हो सकती');
    } else {
        e.target.style.borderColor = '';
        hideInputError(e.target);
    }
}

function validateContactNumber(input) {
    if (input.value.length > 0 && input.value.length !== 10) {
        input.style.borderColor = 'var(--error-500)';
        showInputError(input, 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें');
    } else {
        input.style.borderColor = '';
        hideInputError(input);
    }
}

function showInputError(input, message) {
    hideInputError(input); // Remove existing error
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.style.cssText = `
        color: var(--error-500);
        font-size: var(--font-size-sm);
        margin-top: var(--space-1);
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    input.closest('.input-group').appendChild(errorDiv);
}

function hideInputError(input) {
    const errorDiv = input.closest('.input-group').querySelector('.input-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Set current date
function setCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    document.getElementById('date').value = `${year}-${month}-${day}`;
}

// Enhanced tab switching with smooth animations
function switchTab(tabName) {
    // Add loading state
    document.body.classList.add('loading');
    
    // Update tab buttons with smooth animation
    document.querySelectorAll('.premium-tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 100);
    });
    
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    activeButton.classList.add('active');
    activeButton.style.transform = 'scale(1.05)';
    setTimeout(() => {
        activeButton.style.transform = 'scale(1)';
    }, 200);

    // Update tab content with fade effect
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.opacity = '0';
    });
    
    const targetTab = document.getElementById(`${tabName}-tab`);
    targetTab.classList.add('active');
    
    // Smooth fade in with delay
    setTimeout(() => {
        targetTab.style.opacity = '1';
        document.body.classList.remove('loading');
    }, 150);

    // Refresh data when switching to records or summary
    if (tabName === 'records') {
        setTimeout(() => displayRecords(), 200);
    } else if (tabName === 'summary') {
        setTimeout(() => updateSummary(), 200);
    }
}

// Enhanced calculations with smooth animations
function updateCalculations() {
    const acres = parseFloat(document.getElementById('landInAcres').value) || 0;
    const rate = parseFloat(document.getElementById('ratePerAcre').value) || 0;
    const nakadPaid = parseFloat(document.getElementById('nakadPaid').value) || 0;
    
    // Calculate total payment
    const total = acres * rate;
    const pending = total - nakadPaid;
    
    // Update total payment display with animation
    const totalElement = document.getElementById('totalPayment');
    totalElement.style.transform = 'scale(1.05)';
    totalElement.style.transition = 'all 0.2s ease';
    
    setTimeout(() => {
        totalElement.textContent = `₹ ${total.toLocaleString('hi-IN')}`;
        totalElement.style.transform = 'scale(1)';
    }, 100);
    
    // Update payment summary
    animateValueUpdate('summaryTotal', `₹ ${total.toLocaleString('hi-IN')}`);
    animateValueUpdate('summaryPaid', `₹ ${nakadPaid.toLocaleString('hi-IN')}`);
    animateValueUpdate('summaryPending', `₹ ${pending.toLocaleString('hi-IN')}`);
}

// Enhanced form submission with loading states
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Add loading state to button
    const submitButton = document.querySelector('.premium-save-button');
    const originalContent = submitButton.innerHTML;
    
    submitButton.innerHTML = `
        <i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i>
        <span>सेव हो रहा है...</span>
    `;
    submitButton.disabled = true;
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Simulate processing time for better UX
    setTimeout(() => {
        const acres = parseFloat(document.getElementById('landInAcres').value) || 0;
        const rate = parseFloat(document.getElementById('ratePerAcre').value) || 0;
        const nakadPaid = parseFloat(document.getElementById('nakadPaid').value) || 0;
        const total = acres * rate;
        
        const formData = {
            id: Date.now().toString(),
            farmerName: document.getElementById('farmerName').value.trim(),
            contactNumber: document.getElementById('contactNumber').value.trim(),
            date: formatDateForDisplay(document.getElementById('date').value.trim()),
            landInAcres: acres.toString(),
            landInDismil: (acres * 100).toString(),
            ratePerAcre: rate.toString(),
            totalPayment: total.toString(),
            nakadPaid: nakadPaid.toString(),
            pendingAmount: (total - nakadPaid).toString(),
            fullPaymentDate: formatDateForDisplay(document.getElementById('fullPaymentDate').value.trim()) || ''
        };

        // Enhanced validation
        if (!formData.farmerName || !formData.contactNumber || !formData.landInAcres || !formData.ratePerAcre) {
            showMessage('कृपया सभी आवश्यक फील्ड भरें', 'error');
            resetSubmitButton(submitButton, originalContent);
            return;
        }

        if (formData.contactNumber.length !== 10) {
            showMessage('कृपया 10 अंकों का मोबाइल नंबर दर्ज करें', 'error');
            resetSubmitButton(submitButton, originalContent);
            return;
        }

        if (parseFloat(formData.landInAcres) <= 0) {
            showMessage('कृपया वैध ज़मीन का क्षेत्रफल दर्ज करें', 'error');
            resetSubmitButton(submitButton, originalContent);
            return;
        }

        if (parseFloat(formData.ratePerAcre) <= 0) {
            showMessage('कृपया वैध दर दर्ज करें', 'error');
            resetSubmitButton(submitButton, originalContent);
            return;
        }

        if (nakadPaid > total) {
            showMessage('नकद राशि कुल राशि से अधिक नहीं हो सकती', 'error');
            resetSubmitButton(submitButton, originalContent);
            return;
        }

        // Save record with animation
        records.push(formData);
        saveRecords();
        
        // Reset form with smooth animation
        const form = document.getElementById('entryForm');
        form.style.transform = 'scale(0.98)';
        form.style.transition = 'all 0.2s ease';
        
        setTimeout(() => {
            form.reset();
            setCurrentDate();
            updateCalculations();
            form.style.transform = 'scale(1)';
            resetSubmitButton(submitButton, originalContent);
        }, 200);
        
        showMessage('रिकॉर्ड सफलतापूर्वक सेव हो गया! 🎉', 'success');
    }, 800);
}

function resetSubmitButton(button, originalContent) {
    button.innerHTML = originalContent;
    button.disabled = false;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Enhanced message display with better animations
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => existingMessage.remove(), 300);
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" style="width: 20px; height: 20px;"></i>
        <span style="font-weight: 600;">${message}</span>
    `;
    
    const form = document.getElementById('entryForm');
    form.insertBefore(messageDiv, form.firstChild);
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Auto remove with smooth animation
    setTimeout(() => {
        messageDiv.classList.add('hide');
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
}

// Load records from localStorage
function loadRecords() {
    try {
        const savedRecords = localStorage.getItem('farmerRecords');
        if (savedRecords) {
            records = JSON.parse(savedRecords);
        }
        filteredRecords = [...records];
    } catch (error) {
        console.error('Error loading records:', error);
        showMessage('रिकॉर्ड लोड करने में समस्या हुई', 'error');
    }
}

// Save records to localStorage
function saveRecords() {
    try {
        localStorage.setItem('farmerRecords', JSON.stringify(records));
    } catch (error) {
        console.error('Error saving records:', error);
        showMessage('रिकॉर्ड सेव करने में समस्या हुई', 'error');
    }
}

// Enhanced search with better UX
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    // Add loading state to search
    const searchContainer = e.target.closest('.search-container');
    searchContainer.style.opacity = '0.7';
    
    setTimeout(() => {
        if (query === '') {
            filteredRecords = [...records];
        } else {
            filteredRecords = records.filter(record =>
                record.farmerName.toLowerCase().includes(query) ||
                record.contactNumber.includes(query) ||
                record.date.includes(query)
            );
        }
        
        displayRecords();
        searchContainer.style.opacity = '1';
    }, 200);
}

// Enhanced display records with staggered animations
function displayRecords() {
    const recordsList = document.getElementById('recordsList');
    const recordsCount = document.getElementById('recordsCount');
    const emptyState = document.getElementById('emptyState');
    
    recordsCount.textContent = `कुल ${filteredRecords.length} रिकॉर्ड मिले`;
    
    if (filteredRecords.length === 0) {
        recordsList.innerHTML = '';
        recordsList.appendChild(emptyState);
        const searchQuery = document.getElementById('searchInput').value.trim();
        emptyState.querySelector('.empty-state-subtitle').textContent = 
            searchQuery ? 'खोज को बदलकर दोबारा कोशिश करें' : 'नई एंट्री जोड़ने के लिए "नई एंट्री" टैब पर जाएं';
        return;
    }
    
    recordsList.innerHTML = '';
    
    filteredRecords.forEach((record, index) => {
        const recordCard = createRecordCard(record);
        recordCard.style.opacity = '0';
        recordCard.style.transform = 'translateY(20px)';
        recordsList.appendChild(recordCard);
        
        // Staggered animation
        setTimeout(() => {
            recordCard.style.transition = 'all 0.3s ease';
            recordCard.style.opacity = '1';
            recordCard.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Create enhanced record card with payment tracking
function createRecordCard(record) {
    const card = document.createElement('div');
    card.className = 'record-card';
    
    const totalPayment = parseFloat(record.totalPayment) || 0;
    const nakadPaid = parseFloat(record.nakadPaid) || 0;
    const pendingAmount = totalPayment - nakadPaid;
    const isFullyPaid = pendingAmount <= 0;
    
    card.innerHTML = `
        <div class="record-header">
            <div class="record-header-left">
                <div class="farmer-name">${record.farmerName}</div>
                <div class="contact-container">
                    <i data-lucide="phone" style="width: 14px; height: 14px; color: var(--primary-600);"></i>
                    <span class="contact-number">${record.contactNumber}</span>
                </div>
                <div class="date-container">
                    <i data-lucide="calendar" style="width: 14px; height: 14px; color: var(--primary-600);"></i>
                    <span class="date">${record.date}</span>
                </div>
            </div>
            <button class="delete-button" onclick="deleteRecord('${record.id}')" aria-label="रिकॉर्ड डिलीट करें">
                <i data-lucide="trash-2"></i>
            </button>
        </div>

        <div class="record-details">
            <div class="detail-item">
                <div class="detail-label">ज़मीन (एकड़)</div>
                <div class="detail-value">${record.landInAcres}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">प्रति एकड़ दर</div>
                <div class="detail-value">₹ ${parseFloat(record.ratePerAcre).toLocaleString('hi-IN')}</div>
            </div>
            <div class="detail-item highlight">
                <div class="detail-label">कुल राशि</div>
                <div class="detail-value">₹ ${totalPayment.toLocaleString('hi-IN')}</div>
            </div>
            <div class="detail-item highlight">
                <div class="detail-label">नकद भुगतान</div>
                <div class="detail-value">₹ ${nakadPaid.toLocaleString('hi-IN')}</div>
            </div>
            <div class="detail-item ${pendingAmount > 0 ? 'warning' : 'highlight'}">
                <div class="detail-label">बकाया राशि</div>
                <div class="detail-value">₹ ${pendingAmount.toLocaleString('hi-IN')}</div>
            </div>
            ${record.fullPaymentDate ? `
            <div class="detail-item">
                <div class="detail-label">पूरा भुगतान तारीख</div>
                <div class="detail-value">${record.fullPaymentDate}</div>
            </div>
            ` : ''}
        </div>

        <div class="payment-status ${isFullyPaid ? 'paid' : 'pending'}">
            ${isFullyPaid ? '✅ पूरा भुगतान हो गया' : '⏳ भुगतान बकाया है'}
        </div>
    `;
    
    // Re-initialize Lucide icons for the new card
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 0);
    
    return card;
}

// Enhanced delete record with better confirmation
function deleteRecord(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;
    
    const confirmMessage = `क्या आप वाकई "${record.farmerName}" का रिकॉर्ड डिलीट करना चाहते हैं?\n\nयह क्रिया को वापस नहीं किया जा सकता।`;
    
    if (confirm(confirmMessage)) {
        // Add deletion animation
        const cardElement = document.querySelector(`[onclick="deleteRecord('${id}')"]`).closest('.record-card');
        cardElement.style.transition = 'all 0.3s ease';
        cardElement.style.transform = 'scale(0.95)';
        cardElement.style.opacity = '0.5';
        
        setTimeout(() => {
            records = records.filter(record => record.id !== id);
            filteredRecords = filteredRecords.filter(record => record.id !== id);
            saveRecords();
            displayRecords();
            updateSummary();
            showMessage('रिकॉर्ड सफलतापूर्वक डिलीट हो गया', 'success');
        }, 300);
    }
}

// Enhanced period selection with smooth transitions
function selectPeriod(period) {
    selectedPeriod = period;
    
    // Update button states with animation
    document.querySelectorAll('.period-button').forEach(btn => {
        btn.classList.remove('active');
        btn.style.transform = 'scale(0.95)';
        btn.style.transition = 'all 0.2s ease';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 100);
    });
    
    const activeButton = document.querySelector(`[data-period="${period}"]`);
    activeButton.classList.add('active');
    activeButton.style.transform = 'scale(1.05)';
    setTimeout(() => {
        activeButton.style.transform = 'scale(1)';
    }, 200);
    
    updateSummary();
}

// Parse date string (DD/MM/YYYY)
function parseDate(dateString) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    return null;
}

// Filter records by period
function getFilteredRecordsByPeriod(period) {
    if (period === 'all') return records;
    
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return records.filter(record => {
        const recordDate = parseDate(record.date);
        if (!recordDate) return false;
        
        switch (period) {
            case 'today':
                return recordDate.toDateString() === today;
            case 'week':
                return recordDate >= weekAgo;
            case 'month':
                return recordDate >= monthAgo;
            default:
                return true;
        }
    });
}

// Enhanced summary update with payment tracking
function updateSummary() {
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Update period counts with animations
    const todayRecords = records.filter(record => {
        const recordDate = parseDate(record.date);
        return recordDate && recordDate.toDateString() === today;
    }).length;
    
    const weekRecords = records.filter(record => {
        const recordDate = parseDate(record.date);
        return recordDate && recordDate >= weekAgo;
    }).length;
    
    const monthRecords = records.filter(record => {
        const recordDate = parseDate(record.date);
        return recordDate && recordDate >= monthAgo;
    }).length;
    
    animateCounterUpdate('todayCount', todayRecords);
    animateCounterUpdate('weekCount', weekRecords);
    animateCounterUpdate('monthCount', monthRecords);
    animateCounterUpdate('allCount', records.length);
    
    // Get filtered records for selected period
    const filteredRecords = getFilteredRecordsByPeriod(selectedPeriod);
    
    // Calculate stats with payment tracking
    const totalRecords = filteredRecords.length;
    const totalLandInAcres = filteredRecords.reduce((sum, record) => {
        return sum + (parseFloat(record.landInAcres) || 0);
    }, 0);
    const totalPayment = filteredRecords.reduce((sum, record) => {
        return sum + (parseFloat(record.totalPayment) || 0);
    }, 0);
    const totalPending = filteredRecords.reduce((sum, record) => {
        const total = parseFloat(record.totalPayment) || 0;
        const paid = parseFloat(record.nakadPaid) || 0;
        return sum + (total - paid);
    }, 0);
    const averageRatePerAcre = totalRecords > 0 
        ? filteredRecords.reduce((sum, record) => sum + (parseFloat(record.ratePerAcre) || 0), 0) / totalRecords
        : 0;
    
    // Update display with animations
    animateCounterUpdate('totalRecords', totalRecords);
    animateValueUpdate('totalLand', `${totalLandInAcres.toFixed(2)} एकड़`);
    animateValueUpdate('totalPaymentStat', `₹ ${totalPayment.toLocaleString('hi-IN')}`);
    animateValueUpdate('totalPending', `₹ ${totalPending.toLocaleString('hi-IN')}`);
    
    // Additional stats with smooth reveal
    const additionalStats = document.getElementById('additionalStats');
    if (totalRecords > 0) {
        additionalStats.style.display = 'block';
        additionalStats.style.opacity = '0';
        additionalStats.style.transform = 'translateY(20px)';
        additionalStats.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            additionalStats.style.opacity = '1';
            additionalStats.style.transform = 'translateY(0)';
        }, 100);
        
        animateValueUpdate('avgLandPerRecord', `${(totalLandInAcres / totalRecords).toFixed(2)} एकड़`);
        animateValueUpdate('avgPaymentPerRecord', `₹ ${(totalPayment / totalRecords).toFixed(0)}`);
        animateValueUpdate('averageRate', `₹ ${averageRatePerAcre.toFixed(0)}`);
    } else {
        additionalStats.style.opacity = '0';
        additionalStats.style.transform = 'translateY(20px)';
        setTimeout(() => {
            additionalStats.style.display = 'none';
        }, 300);
    }
}

// Animate counter updates with easing
function animateCounterUpdate(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    if (currentValue !== targetValue) {
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(currentValue + (targetValue - currentValue) * easeOutQuart);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = targetValue;
                element.style.transform = 'scale(1)';
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
}

// Animate value updates with smooth transitions
function animateValueUpdate(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.style.transform = 'scale(1.05)';
    element.style.opacity = '0.7';
    element.style.transition = 'all 0.2s ease';
    
    setTimeout(() => {
        element.textContent = targetValue;
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
    }, 100);
}

// Keyboard shortcuts for better accessibility
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S to save form
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'entry-tab') {
            document.getElementById('entryForm').dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
    }
    
    // Tab navigation with arrow keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const tabs = ['entry', 'records', 'summary'];
        const currentTab = document.querySelector('.premium-tab-button.active').dataset.tab;
        const currentIndex = tabs.indexOf(currentTab);
        
        if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
            switchTab(tabs[currentIndex + 1]);
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
            switchTab(tabs[currentIndex - 1]);
        }
    }
}

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showMessage('एप्लिकेशन में कोई समस्या हुई है', 'error');
});

// Make deleteRecord function globally available
window.deleteRecord = deleteRecord;

// Add touch gestures for mobile with improved sensitivity
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', function(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Only handle horizontal swipes with minimum distance
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
        const tabs = ['entry', 'records', 'summary'];
        const currentTab = document.querySelector('.premium-tab-button.active').dataset.tab;
        const currentIndex = tabs.indexOf(currentTab);
        
        if (diffX > 0 && currentIndex < tabs.length - 1) {
            // Swipe left - next tab
            switchTab(tabs[currentIndex + 1]);
        } else if (diffX < 0 && currentIndex > 0) {
            // Swipe right - previous tab
            switchTab(tabs[currentIndex - 1]);
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
}, { passive: true });

// Add CSS for spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);