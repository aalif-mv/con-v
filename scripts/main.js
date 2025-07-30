// Configuration
const RTL_LANGUAGES = ['dv', 'ar', 'he', 'fa', 'ur'];
let currentLang = 'en';
let currency = 'Rf';
let translations = {};

// Units definition
const units = {
  m:  { short: 'm', toMeter: 1 },
  cm: { short: 'cm', toMeter: 0.01 },
  mm: { short: 'mm', toMeter: 0.001 },
  km: { short: 'km', toMeter: 1000 },
  in: { short: 'in', toMeter: 0.0254 },
  ft: { short: 'ft', toMeter: 0.3048 },
  yd: { short: 'yd', toMeter: 0.9144 },
  muh: { short: 'muh', toMeter: 0.4572 }
};

// DOM Elements
const elements = {
  lengthInput: document.getElementById('lengthInput'),
  unitFrom: document.getElementById('unitFrom'),
  unitTo: document.getElementById('unitTo'),
  convertedResult: document.getElementById('convertedResult'),
  quantityInput: document.getElementById('quantityInput'),
  unitPriceInput: document.getElementById('unitPriceInput'),
  discountInput: document.getElementById('discountInput'),
  discountType: document.getElementById('discountType'),
  priceResult: document.getElementById('priceResult'),
  languageSelect: document.getElementById('languageSelect'),
  darkModeToggle: document.getElementById('darkModeToggle'),
  copyBtn: document.getElementById('copyBtn'),
  useConvertedBtn: document.getElementById('useConvertedBtn'),
  labels: {
    title: document.getElementById('title'),
    labelLength: document.getElementById('label-length'),
    labelTo: document.getElementById('label-to'),
    labelQuantity: document.getElementById('label-quantity'),
    labelUnitPrice: document.getElementById('label-unitPrice'),
    labelDiscount: document.getElementById('label-discount'),
    darkModeLabel: document.getElementById('darkModeLabel'),
    labelLanguage: document.getElementById('label-language'),
    lengthUnitTooltipLabel: document.getElementById('lengthUnitTooltip'),
    useConvertedBtnLabel: document.getElementById('useConvertedBtn'),
    copyBtnLabel: document.getElementById('copyBtn')
  }
};



// Initialize the application
async function initApp() {
  await loadTranslations();
  setupEventListeners();
  
  // Check for saved preferences
  loadPreferences();

  populateUnits();

  translateUI();
  setLanguageDirection(currentLang);

}

// Load translations from JSON file
async function loadTranslations() {
  try {
    const response = await fetch('scripts/translations.json');
    translations = await response.json();
  } catch (error) {
    console.error('Error loading translations:', error);
  }
}

// Load user preferences from localStorage
function loadPreferences() {
  // Dark mode
  const darkMode = localStorage.getItem('darkMode') === 'true';
  elements.darkModeToggle.checked = darkMode;
  document.body.classList.toggle('dark', darkMode);
  
  // Language
  const savedLang = localStorage.getItem('language');
  if (savedLang && translations[savedLang]) {
    currentLang = savedLang;
    elements.languageSelect.value = currentLang;
  }
}

// Save preferences to localStorage
function savePreferences() {
  localStorage.setItem('darkMode', elements.darkModeToggle.checked);
  localStorage.setItem('language', currentLang);
}

// Populate unit selectors
function populateUnits() {
  [elements.unitFrom, elements.unitTo].forEach(select => {
    select.innerHTML = '';
    for (const key in units) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = translations[currentLang]?.units[key] || key;
      select.appendChild(option);
    }
  });
  elements.unitFrom.value = 'muh';
  elements.unitTo.value = 'muh';
}

// Set language direction (LTR/RTL)
function setLanguageDirection(lang) {
  const isRTL = RTL_LANGUAGES.includes(lang);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// Translate UI elements
function translateUI() {
  const t = translations[currentLang] || translations.en;
  
  // Update labels
  elements.labels.title.textContent = t.title;
  elements.labels.labelLength.textContent = t.length;
  elements.labels.lengthUnitTooltipLabel.textContent = t.tooltip;
  elements.labels.labelTo.textContent = t.to;
  elements.labels.labelQuantity.textContent = t.quantity;
  elements.labels.labelUnitPrice.textContent = t.unitPrice;
  elements.labels.labelDiscount.textContent = t.discount;
  elements.labels.darkModeLabel.textContent = t.darkMode;
  elements.labels.labelLanguage.textContent = t.language;
  elements.labels.useConvertedBtnLabel.textContent = t.useConvertedBtn;
  elements.labels.copyBtnLabel.textContent = t.copyBtn;

  // Update dropdown options
  if (elements.discountType.options.length > 0) {
    elements.discountType.options[0].textContent = t.discountPercent;
    elements.discountType.options[1].textContent = t.discountFixed;
  }

  updateConversion();
  updatePrice();
}

// Conversion functions
function roundUpToNearestHalf(num) {
  return Math.ceil(num * 2) / 2;
}

function convertLength(value, fromUnit, toUnit) {
  if (isNaN(value) || value === '') return '';
  const meters = value * units[fromUnit].toMeter;
  return meters / units[toUnit].toMeter;
}

function updateConversion() {
  const val = parseFloat(elements.lengthInput.value);
  const fromU = elements.unitFrom.value;
  const toU = elements.unitTo.value;
  
  if (isNaN(val) || val < 0) {
    elements.convertedResult.textContent = `${translations[currentLang]?.resultPrefix || 'Result:'} --`;
    return;
  }

  const result = convertLength(val, fromU, toU);
  let rounded = toU === 'muh' 
    ? roundUpToNearestHalf(result) 
    : Math.round(result * 10000) / 10000;

  const t = translations[currentLang] || translations.en;
  elements.convertedResult.textContent = `${t.resultPrefix} ${rounded} ${t.units[toU]}`;
}

// Price calculation functions
function updatePrice() {
  const quantity = parseFloat(elements.quantityInput.value);
  const unitPrice = parseFloat(elements.unitPriceInput.value);
  const discountVal = parseFloat(elements.discountInput.value);
  const discountT = elements.discountType.value;

  if (isNaN(quantity) || quantity < 0 ||
      isNaN(unitPrice) || unitPrice < 0 ||
      isNaN(discountVal) || discountVal < 0) {
    elements.priceResult.textContent = `${translations[currentLang]?.priceResultPrefix || 'Total Price:'} --`;
    return;
  }

  let total = quantity * unitPrice;
  if (discountT === 'percent') {
    total *= (1 - discountVal / 100);
  } else {
    total -= discountVal;
  }

  total = Math.max(0, Math.round(total * 100) / 100);
  const t = translations[currentLang] || translations.en;
  elements.priceResult.textContent = `${t.priceResultPrefix} ${currency} ${total.toLocaleString()}`;
}

// Utility functions
function copyToClipboard() {
  const text = `${elements.convertedResult.textContent}\n${elements.priceResult.textContent}`;
  navigator.clipboard.writeText(text).then(() => {
    const t = translations[currentLang] || translations.en;
    alert(t.copySuccess);
  });
}

function useConvertedAsQuantity() {
  const val = parseFloat(elements.lengthInput.value);
  const fromU = elements.unitFrom.value;
  const toU = elements.unitTo.value;
  
  if (isNaN(val) || val < 0) return;

  const convertedVal = convertLength(val, fromU, toU);
  if (isNaN(convertedVal)) return;

  const muhQuantity = toU === 'muh' 
    ? convertedVal 
    : convertLength(convertedVal, toU, 'muh');

  elements.quantityInput.value = roundUpToNearestHalf(muhQuantity);
  updatePrice();
}

// Event listeners setup
function setupEventListeners() {
  // Conversion section
  elements.lengthInput.addEventListener('input', updateConversion);
  elements.unitFrom.addEventListener('change', updateConversion);
  elements.unitTo.addEventListener('change', updateConversion);

  // Price section
  elements.quantityInput.addEventListener('input', updatePrice);
  elements.unitPriceInput.addEventListener('input', updatePrice);
  elements.discountInput.addEventListener('input', updatePrice);
  elements.discountType.addEventListener('change', updatePrice);

  // Language selector
  elements.languageSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    setLanguageDirection(currentLang);
    populateUnits();
    translateUI();
    savePreferences();
  });

  // Language experimental
  elements.lengthInput.addEventListener('keydown', (e) => {
    if ((e.key == '-' || e.key == 'Enter') && elements.lengthInput.value == '000-000-000') {
      let exprimentals = document.getElementsByClassName('exprmnt');
      let temp = [];
      for (let i = 0; i < exprimentals.length; i++) {
        exprimentals[i].classList.toggle('hidden')
        temp.push(exprimentals[i].value);
      }
      let T = temp.join('-')
      if (T.includes(currentLang)) {
        elements.languageSelect.value = 'en';
        currentLang = elements.languageSelect.value;
        setLanguageDirection(currentLang);
        populateUnits();
        translateUI();
        savePreferences();
      }
    }
  })

  // Dark mode toggle
  elements.darkModeToggle.addEventListener('change', (e) => {
    document.body.classList.toggle('dark', e.target.checked);
    savePreferences();
  });

  // Buttons
  elements.copyBtn.addEventListener('click', copyToClipboard);
  elements.useConvertedBtn.addEventListener('click', useConvertedAsQuantity);
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
