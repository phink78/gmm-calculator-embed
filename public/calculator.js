// ============================================
// GREEN MARINE CALCULATOR - LOGIC
// ============================================
// Version: 2.2 (Wix Velo Compatible)
// Updated: 29-12-2024
// ============================================

// === CONFIGURATION ===
const CONFIG = {
  // Steps configuration
  steps: [
    {
      id: 'customerType',
      title: 'Wie bent u?',
      subtitle: 'Dit helpt ons de juiste informatie te geven',
      options: [
        { value: 'particulier', label: 'Particulier' },
        { value: 'zakelijk', label: 'Zakelijk' }
      ],
      hasIcons: false
    },
    {
      id: 'boatType',
      title: 'Type boot',
      subtitle: 'Selecteer uw boottype',
      options: [
        { value: 'sloep', label: 'Sloep', icon: 'sloep.svg' },
        { value: 'zeilboot', label: 'Zeilboot', icon: 'zeilboot.svg' },
        { value: 'motorboot', label: 'Motorboot', icon: 'motorboot.svg' },
        { value: 'speedboot', label: 'Speedboot', icon: 'speedboot.svg' },
        { value: 'werkboot', label: 'Werkboot', icon: 'werkboot.svg' },
        { value: 'anders', label: 'Anders', icon: 'anders.svg' }
      ],
      hasIcons: true
    },
    {
      id: 'boatSpecs',
      title: 'Boot specificaties',
      subtitle: 'Geef de afmetingen van uw boot op',
      type: 'input',
      fields: [
        { id: 'boatLength', label: 'Lengte waterlijn (LWL)', unit: 'meter', min: 3, max: 20, step: 0.5, default: 6 },
        { id: 'boatWeight', label: 'Gewicht', unit: 'kg', min: 500, max: 10000, step: 100, default: 2000 }
      ]
    },
    {
      id: 'currentDrive',
      title: 'Huidige aandrijving',
      subtitle: 'Wat voor motor heeft uw boot nu?',
      options: [
        { value: 'geen', label: 'Geen motor' },
        { value: 'binnenboord', label: 'Binnenboord' }
      ],
      hasIcons: false
    },
    {
      id: 'waterType',
      title: 'Vaargebied',
      subtitle: 'Waar vaart u voornamelijk?',
      options: [
        { value: 'binnenwater', label: 'Binnenwater' },
        { value: 'kustwater', label: 'Kustwater' },
        { value: 'beide', label: 'Beide' }
      ],
      hasIcons: false
    },
    {
      id: 'tripDuration',
      title: 'Gemiddelde vaartocht',
      subtitle: 'Hoe lang vaart u gemiddeld?',
      options: [
        { value: '2-4', label: '2-4 uur' },
        { value: '4-8', label: '4-8 uur' },
        { value: '8+', label: '8+ uur' }
      ],
      hasIcons: false
    }
  ],
  
  // Motor database
  motors: [
    { name: 'Green Marine 3.0', power: 3, maxWeight: 1500, minLength: 3, maxLength: 6 },
    { name: 'Green Marine 6.0', power: 6, maxWeight: 3000, minLength: 4, maxLength: 8 },
    { name: 'Green Marine 10.0', power: 10, maxWeight: 5000, minLength: 5, maxLength: 12 },
    { name: 'Green Marine 15.0', power: 15, maxWeight: 7000, minLength: 6, maxLength: 15 },
    { name: 'Green Marine 25.0', power: 25, maxWeight: 10000, minLength: 8, maxLength: 20 }
  ],
  
  // USPs for results
  usps: [
    'Fluisterstil varen',
    '5 jaar garantie op motor',
    'Gratis installatie advies',
    'Nederlandse kwaliteit',
    'Snelle levering'
  ]
};

// === STATE MANAGEMENT ===
let state = {
  currentStep: 0,
  formData: {
    customerType: '',
    boatType: '',
    boatLength: 6,
    boatWeight: 2000,
    currentDrive: '',
    waterType: '',
    tripDuration: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  },
  showResults: false,
  showContactForm: false
};

// === CALCULATION FUNCTIONS ===

/**
 * Calculate hull speed in km/h
 * Formula: Hull Speed (knots) = 1.34 × √LWL (feet)
 */
function calculateHullSpeed(lengthMeters) {
  const lengthFeet = lengthMeters * 3.28084;
  const hullSpeedKnots = 1.34 * Math.sqrt(lengthFeet);
  return hullSpeedKnots * 1.852; // Convert to km/h
}

/**
 * Calculate cruising speed (70% of hull speed)
 */
function calculateCruisingSpeed(lengthMeters) {
  return calculateHullSpeed(lengthMeters) * 0.7;
}

/**
 * Calculate required motor power based on boat specs
 */
function calculateRequiredPower(weight, length, waterType) {
  // Base power calculation: ~1 kW per 500kg + length factor
  let basePower = (weight / 500) + (length * 0.5);
  
  // Adjust for water type
  if (waterType === 'kustwater') {
    basePower *= 1.3; // 30% more power for coastal waters
  } else if (waterType === 'beide') {
    basePower *= 1.15; // 15% more for mixed use
  }
  
  return basePower;
}

/**
 * Calculate battery capacity based on trip duration
 */
function calculateBatteryCapacity(motorPower, tripDuration) {
  const hours = {
    '2-4': 3,
    '4-8': 6,
    '8+': 10
  };
  const avgHours = hours[tripDuration] || 4;
  
  // Battery capacity = Power × Hours × 1.2 (20% reserve)
  return Math.ceil(motorPower * avgHours * 1.2);
}

/**
 * Get motor recommendation based on specs
 */
function calculateRecommendation() {
  const { boatLength, boatWeight, waterType, tripDuration } = state.formData;
  
  const length = parseFloat(boatLength);
  const weight = parseInt(boatWeight);
  const requiredPower = calculateRequiredPower(weight, length, waterType);
  const cruisingSpeed = calculateCruisingSpeed(length);
  
  // Find suitable motor
  let recommendedMotor = CONFIG.motors[CONFIG.motors.length - 1]; // Default to largest
  
  for (const motor of CONFIG.motors) {
    if (motor.power >= requiredPower && 
        motor.maxWeight >= weight && 
        motor.minLength <= length && 
        motor.maxLength >= length) {
      recommendedMotor = motor;
      break;
    }
  }
  
  const batteryCapacity = calculateBatteryCapacity(recommendedMotor.power, tripDuration);
  
  // Estimate cruising time with recommended setup
  const estimatedCruisingTime = Math.round(batteryCapacity / (recommendedMotor.power * 0.7));
  
  return {
    motor: recommendedMotor.name,
    motorPower: recommendedMotor.power,
    batteryCapacity: batteryCapacity,
    cruisingSpeed: cruisingSpeed.toFixed(1),
    estimatedCruisingTime: estimatedCruisingTime
  };
}

// === DOM HELPER FUNCTIONS ===

/**
 * Update progress bar
 */
function updateProgress() {
  const totalSteps = CONFIG.steps.length;
  const progress = ((state.currentStep + 1) / totalSteps) * 100;
  
  const progressFill = document.querySelector('.gmm-progress-fill');
  const progressStep = document.querySelector('.gmm-progress-step');
  const progressPercent = document.querySelector('.gmm-progress-percent');
  
  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressStep) progressStep.textContent = `Stap ${state.currentStep + 1} van ${totalSteps}`;
  if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
}

/**
 * Update slider track gradient
 */
function updateSliderTrack(slider, min, max, value) {
  const percentage = ((value - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--gmm-marine-green) 0%, var(--gmm-marine-green) ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}

/**
 * Render current step content
 */
function renderStep() {
  const step = CONFIG.steps[state.currentStep];
  const contentArea = document.querySelector('.gmm-content');
  
  if (!contentArea || !step) return;
  
  let html = `
    <h2 class="gmm-step-title">${step.title}</h2>
    <p class="gmm-step-subtitle">${step.subtitle}</p>
  `;
  
  if (step.type === 'input') {
    // Slider inputs
    html += '<div class="gmm-slider-group">';
    step.fields.forEach(field => {
      const value = state.formData[field.id] || field.default;
      html += `
        <div class="gmm-slider-item">
          <div class="gmm-slider-header">
            <label class="gmm-slider-label">${field.label}</label>
            <span class="gmm-slider-value">
              <span id="${field.id}-display">${value}</span>
              <span class="gmm-slider-unit">${field.unit}</span>
            </span>
          </div>
          <input 
            type="range" 
            class="gmm-slider" 
            id="${field.id}"
            min="${field.min}" 
            max="${field.max}" 
            step="${field.step}" 
            value="${value}"
          />
          <div class="gmm-slider-range">
            <span>${field.min} ${field.unit}</span>
            <span>${field.max} ${field.unit}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    html += '<button class="gmm-button-primary" id="specs-submit">Volgende</button>';
  } else {
    // Option buttons
    const gridClass = step.hasIcons ? 'gmm-options-grid--two-col' : 
                      (step.options.length <= 3 ? 'gmm-options-grid--one-col' : 'gmm-options-grid--two-col');
    
    html += `<div class="gmm-options-grid ${gridClass}">`;
    step.options.forEach(option => {
      const isSelected = state.formData[step.id] === option.value;
      const iconClass = step.hasIcons ? 'gmm-option-button--with-icon' : '';
      const selectedClass = isSelected ? 'gmm-option-button--selected' : '';
      
      html += `
        <button 
          class="gmm-option-button ${iconClass} ${selectedClass}" 
          data-field="${step.id}" 
          data-value="${option.value}"
        >
          ${step.hasIcons && option.icon ? `<img src="${option.icon}" alt="" class="gmm-option-icon" />` : ''}
          <span class="gmm-option-label">${option.label}</span>
        </button>
      `;
    });
    html += '</div>';
  }
  
  contentArea.innerHTML = html;
  
  // Attach event listeners
  attachStepListeners(step);
}

/**
 * Render results section
 */
function renderResults() {
  const recommendation = calculateRecommendation();
  const contentArea = document.querySelector('.gmm-content');
  
  if (!contentArea) return;
  
  let uspsHtml = CONFIG.usps.map(usp => `
    <li class="gmm-usp-item">
      <span class="gmm-usp-icon">✓</span>
      ${usp}
    </li>
  `).join('');
  
  contentArea.innerHTML = `
    <div class="gmm-results">
      <div class="gmm-results-icon">⚡</div>
      <h2 class="gmm-results-title">Uw aanbeveling</h2>
      <p class="gmm-results-subtitle">Op basis van uw bootgegevens</p>
      
      <div class="gmm-results-card">
        <p class="gmm-results-motor-label">Aanbevolen motor</p>
        <h3 class="gmm-results-motor-name">${recommendation.motor}</h3>
        <p class="gmm-results-motor-power">${recommendation.motorPower} kW</p>
        
        <div class="gmm-results-specs">
          <div class="gmm-results-spec">
            <p class="gmm-results-spec-label">Accu capaciteit</p>
            <p class="gmm-results-spec-value">${recommendation.batteryCapacity} kWh</p>
          </div>
          <div class="gmm-results-spec">
            <p class="gmm-results-spec-label">Kruissnelheid</p>
            <p class="gmm-results-spec-value">${recommendation.cruisingSpeed} km/u</p>
          </div>
          <div class="gmm-results-spec">
            <p class="gmm-results-spec-label">Vaartijd</p>
            <p class="gmm-results-spec-value">~${recommendation.estimatedCruisingTime} uur</p>
          </div>
        </div>
      </div>
      
      <ul class="gmm-usp-list">
        ${uspsHtml}
      </ul>
      
      <button class="gmm-button-primary" id="show-contact">
        Vraag een offerte aan
      </button>
    </div>
  `;
  
  // Hide progress bar
  const progressContainer = document.querySelector('.gmm-progress-container');
  if (progressContainer) progressContainer.classList.add('gmm-hidden');
  
  // Attach contact button listener
  document.getElementById('show-contact')?.addEventListener('click', () => {
    state.showContactForm = true;
    renderContactForm();
  });
}

/**
 * Render contact form
 */
function renderContactForm() {
  const contentArea = document.querySelector('.gmm-content');
  
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <h2 class="gmm-step-title">Uw gegevens</h2>
    <p class="gmm-step-subtitle">Wij nemen binnen 24 uur contact met u op</p>
    
    <form class="gmm-contact-form" id="contact-form">
      <div class="gmm-input-group">
        <label class="gmm-input-label">Voornaam *</label>
        <input type="text" class="gmm-input" id="firstName" placeholder="Uw voornaam" required />
      </div>
      <div class="gmm-input-group">
        <label class="gmm-input-label">Achternaam *</label>
        <input type="text" class="gmm-input" id="lastName" placeholder="Uw achternaam" required />
      </div>
      <div class="gmm-input-group">
        <label class="gmm-input-label">E-mail *</label>
        <input type="email" class="gmm-input" id="email" placeholder="uw@email.nl" required />
      </div>
      <div class="gmm-input-group">
        <label class="gmm-input-label">Telefoon</label>
        <input type="tel" class="gmm-input" id="phone" placeholder="06 12345678" />
      </div>
      <button type="submit" class="gmm-button-primary">Verstuur aanvraag</button>
    </form>
  `;
  
  // Attach form listener
  document.getElementById('contact-form')?.addEventListener('submit', handleFormSubmit);
}

/**
 * Attach event listeners for current step
 */
function attachStepListeners(step) {
  if (step.type === 'input') {
    // Slider listeners
    step.fields.forEach(field => {
      const slider = document.getElementById(field.id);
      const display = document.getElementById(`${field.id}-display`);
      
      if (slider) {
        // Initialize track gradient
        updateSliderTrack(slider, field.min, field.max, slider.value);
        
        slider.addEventListener('input', (e) => {
          const value = e.target.value;
          state.formData[field.id] = value;
          if (display) display.textContent = value;
          updateSliderTrack(slider, field.min, field.max, value);
        });
      }
    });
    
    // Submit button
    document.getElementById('specs-submit')?.addEventListener('click', () => {
      goToNextStep();
    });
  } else {
    // Option button listeners
    document.querySelectorAll('.gmm-option-button').forEach(button => {
      button.addEventListener('click', () => {
        const field = button.dataset.field;
        const value = button.dataset.value;
        
        state.formData[field] = value;
        
        // Update selected state
        document.querySelectorAll(`[data-field="${field}"]`).forEach(btn => {
          btn.classList.remove('gmm-option-button--selected');
        });
        button.classList.add('gmm-option-button--selected');
        
        // Auto-advance after short delay
        setTimeout(goToNextStep, 300);
      });
    });
  }
}

/**
 * Go to next step
 */
function goToNextStep() {
  if (state.currentStep < CONFIG.steps.length - 1) {
    state.currentStep++;
    updateProgress();
    renderStep();
  } else {
    state.showResults = true;
    renderResults();
  }
}

/**
 * Go to previous step
 */
function goToPreviousStep() {
  if (state.showContactForm) {
    state.showContactForm = false;
    renderResults();
  } else if (state.showResults) {
    state.showResults = false;
    state.currentStep = CONFIG.steps.length - 1;
    
    // Show progress bar again
    const progressContainer = document.querySelector('.gmm-progress-container');
    if (progressContainer) progressContainer.classList.remove('gmm-hidden');
    
    updateProgress();
    renderStep();
  } else if (state.currentStep > 0) {
    state.currentStep--;
    updateProgress();
    renderStep();
  }
}

/**
 * Handle contact form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Collect form data
  state.formData.firstName = document.getElementById('firstName')?.value || '';
  state.formData.lastName = document.getElementById('lastName')?.value || '';
  state.formData.email = document.getElementById('email')?.value || '';
  state.formData.phone = document.getElementById('phone')?.value || '';
  
  const recommendation = calculateRecommendation();
  
  const submissionData = {
    // Customer info
    customerType: state.formData.customerType,
    firstName: state.formData.firstName,
    lastName: state.formData.lastName,
    email: state.formData.email,
    phone: state.formData.phone,
    // Boat specs
    boatType: state.formData.boatType,
    boatLength: state.formData.boatLength,
    boatWeight: state.formData.boatWeight,
    currentDrive: state.formData.currentDrive,
    waterType: state.formData.waterType,
    tripDuration: state.formData.tripDuration,
    // Calculated recommendation
    recommendedMotor: recommendation.motor,
    recommendedMotorPower: recommendation.motorPower,
    recommendedBattery: recommendation.batteryCapacity,
    estimatedCruisingTime: recommendation.estimatedCruisingTime,
    cruisingSpeed: recommendation.cruisingSpeed,
    // Metadata
    submissionDate: new Date().toISOString(),
    source: 'calculator'
  };
  
  console.log('Form submission data:', submissionData);
  
  // =============================================
  // TODO: KOPPELING MET WIX DATABASE / PIPEDRIVE
  // =============================================
  // Wix Velo:
  // import wixData from 'wix-data';
  // await wixData.insert('FindYourGreenMarine', submissionData);
  //
  // Webhook (Zapier/Make):
  // await fetch('https://hooks.zapier.com/...', {
  //   method: 'POST',
  //   body: JSON.stringify(submissionData)
  // });
  // =============================================
  
  // Show success message
  const contentArea = document.querySelector('.gmm-content');
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="gmm-results" style="text-align: center;">
        <div class="gmm-results-icon">✅</div>
        <h2 class="gmm-results-title">Bedankt!</h2>
        <p class="gmm-results-subtitle">We nemen binnen 24 uur contact met u op.</p>
      </div>
    `;
  }
}

// === INITIALIZATION ===

/**
 * Initialize calculator
 */
function initCalculator() {
  // Initial render
  updateProgress();
  renderStep();
  
  // Back button listener (if exists)
  document.querySelector('.gmm-button-back')?.addEventListener('click', goToPreviousStep);
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}

// Export for Wix Velo modules
// export { initCalculator, state, CONFIG, calculateRecommendation };
