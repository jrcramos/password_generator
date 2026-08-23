/**
 * Secure Password Generator - Chrome Extension
 * Galaxy Thanos Cosmic Theme & Cryptographically Secure Generator
 */

(() => {
  'use strict';

  // Character Sets
  const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~'
  };

  // Ambiguous characters that look confusingly similar
  const AMBIGUOUS_CHARS = new Set(['0', 'O', 'o', '1', 'l', 'I', '|', '\\', '/', '\'', '`', '"', ';', ':']);

  // DOM Elements
  const passwordDisplay = document.getElementById('passwordDisplay');
  const refreshBtn = document.getElementById('refreshBtn');
  const historyBtn = document.getElementById('historyBtn');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const strengthBarFill = document.getElementById('strengthBarFill');
  const strengthBadge = document.getElementById('strengthBadge');
  const strengthLabel = document.getElementById('strengthLabel');
  const lengthSlider = document.getElementById('lengthSlider');
  const lengthVal = document.getElementById('lengthVal');
  const chkUppercase = document.getElementById('chkUppercase');
  const chkLowercase = document.getElementById('chkLowercase');
  const chkNumbers = document.getElementById('chkNumbers');
  const chkSymbols = document.getElementById('chkSymbols');
  const chkExcludeAmbiguous = document.getElementById('chkExcludeAmbiguous');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // History Modal Elements
  const historyModal = document.getElementById('historyModal');
  const historyBackdrop = document.getElementById('historyBackdrop');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');

  const checkboxes = [
    { el: chkUppercase, key: 'uppercase' },
    { el: chkLowercase, key: 'lowercase' },
    { el: chkNumbers, key: 'numbers' },
    { el: chkSymbols, key: 'symbols' }
  ];

  let toastTimeout = null;
  let passwordHistory = [];

  /**
   * Cryptographically secure random integer in range [0, max)
   */
  function getRandomInt(max) {
    const array = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max;
    let randomVal;
    do {
      window.crypto.getRandomValues(array);
      randomVal = array[0];
    } while (randomVal >= limit);
    return randomVal % max;
  }

  /**
   * Fisher-Yates cryptographically secure array shuffle
   */
  function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Filter out ambiguous characters from a string if enabled
   */
  function filterCharset(charset, excludeAmbiguous) {
    if (!excludeAmbiguous) return charset;
    const filtered = charset.split('').filter(char => !AMBIGUOUS_CHARS.has(char)).join('');
    return filtered.length > 0 ? filtered : charset;
  }

  /**
   * Format relative time (e.g. "Just now", "2m ago")
   */
  function formatTimeAgo(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  /**
   * Generate password based on active options
   */
  function generatePassword(addToHistory = true) {
    const length = parseInt(lengthSlider.value, 10);
    const excludeAmbiguous = chkExcludeAmbiguous.checked;
    const activeSets = [];

    checkboxes.forEach(item => {
      if (item.el.checked) {
        const set = filterCharset(CHAR_SETS[item.key], excludeAmbiguous);
        activeSets.push(set);
      }
    });

    // If somehow all unchecked, default to lowercase + numbers
    if (activeSets.length === 0) {
      chkLowercase.checked = true;
      activeSets.push(filterCharset(CHAR_SETS.lowercase, excludeAmbiguous));
    }

    const passwordChars = [];

    // Ensure at least one character from each selected set is guaranteed
    activeSets.forEach(set => {
      passwordChars.push(set[getRandomInt(set.length)]);
    });

    // Combine all available characters
    const allChars = activeSets.join('');

    // Fill the rest of the length
    while (passwordChars.length < length) {
      passwordChars.push(allChars[getRandomInt(allChars.length)]);
    }

    // Shuffle characters to eliminate predictable prefix ordering
    const finalPassword = secureShuffle(passwordChars).slice(0, length).join('');

    // Update UI
    passwordDisplay.textContent = finalPassword;
    
    // Adjust font size dynamically so password fits without scroll clipping
    if (length > 48) {
      passwordDisplay.style.fontSize = '15.5px';
    } else if (length > 34) {
      passwordDisplay.style.fontSize = '17.5px';
    } else if (length > 20) {
      passwordDisplay.style.fontSize = '20px';
    } else {
      passwordDisplay.style.fontSize = '22px';
    }

    updateStrengthMeter(finalPassword, activeSets.length, length);

    if (addToHistory) {
      recordHistory(finalPassword, length);
    }

    saveSettings();
  }

  /**
   * Record password in history (max 10 items)
   */
  function recordHistory(password, length) {
    if (!password) return;

    // Avoid consecutive duplicates
    if (passwordHistory.length > 0 && passwordHistory[0].password === password) {
      return;
    }

    passwordHistory.unshift({
      password,
      length,
      timestamp: Date.now()
    });

    if (passwordHistory.length > 10) {
      passwordHistory = passwordHistory.slice(0, 10);
    }

    saveHistory();
    renderHistory();
  }

  /**
   * Render history list in modal
   */
  function renderHistory() {
    if (!historyList) return;

    if (passwordHistory.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          No passwords in history yet.<br>Generated passwords will appear here.
        </div>
      `;
      return;
    }

    historyList.innerHTML = passwordHistory.map((item, index) => `
      <div class="history-item" data-index="${index}">
        <div class="history-item-left">
          <div class="history-item-pwd" title="${item.password}">${item.password}</div>
          <div class="history-item-meta">
            <span class="history-item-len">${item.length} chars</span>
            <span>•</span>
            <span>${formatTimeAgo(item.timestamp)}</span>
          </div>
        </div>
        <button type="button" class="history-copy-btn" data-pwd="${item.password.replace(/"/g, '&quot;')}" aria-label="Copy this password">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
      </div>
    `).join('');

    // Attach click listeners to individual history copy buttons
    historyList.querySelectorAll('.history-copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pwd = btn.getAttribute('data-pwd');
        if (pwd) {
          await copyToClipboard(pwd, 'Password copied from history!');
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.innerHTML = `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            `;
          }, 1200);
        }
      });
    });
  }

  /**
   * Calculate password entropy and update strength meter
   */
  function updateStrengthMeter(password, selectedSetsCount, length) {
    // Determine pool size based on character variety
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 30;

    // Entropy = length * log2(poolSize)
    const entropy = poolSize > 0 ? length * Math.log2(poolSize) : 0;

    let strengthText = 'Weak';
    let strengthColor = '#ef4444'; // Red
    let fillPercent = 20;

    if (entropy >= 90 && length >= 18 && selectedSetsCount >= 3) {
      strengthText = 'Very Strong';
      strengthColor = '#059669'; // Emerald Green
      fillPercent = 100;
    } else if (entropy >= 65 && length >= 14) {
      strengthText = 'Strong';
      strengthColor = '#166534'; // Forest Green
      fillPercent = 85;
    } else if (entropy >= 45 && length >= 10) {
      strengthText = 'Medium';
      strengthColor = '#eab308'; // Amber
      fillPercent = 55;
    } else {
      strengthText = 'Weak';
      strengthColor = '#ef4444'; // Red
      fillPercent = 25;
    }

    strengthBarFill.style.width = `${fillPercent}%`;
    strengthBarFill.style.backgroundColor = strengthColor;
    strengthBadge.style.color = strengthColor;
    strengthLabel.textContent = strengthText;
  }

  /**
   * Update Slider UI fill track and highlight preset buttons
   */
  function updateSliderFill() {
    const min = parseFloat(lengthSlider.min) || 8;
    const max = parseFloat(lengthSlider.max) || 64;
    const val = parseFloat(lengthSlider.value) || 22;
    const percentage = ((val - min) / (max - min)) * 100;
    lengthSlider.style.setProperty('--slider-progress', `${percentage}%`);
    lengthVal.textContent = val;

    // Update active preset button highlight
    presetBtns.forEach(btn => {
      if (parseInt(btn.dataset.len, 10) === val) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Generic Copy to Clipboard Helper
   */
  async function copyToClipboard(text, customMessage) {
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      showCopyFeedback(customMessage);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  /**
   * Copy current password to clipboard with smooth feedback
   */
  async function copyPassword() {
    const text = passwordDisplay.textContent;
    if (!text) return;
    await copyToClipboard(text, 'Password copied to clipboard!');
  }

  /**
   * Show visual copied state & toast notification
   */
  function showCopyFeedback(msg = 'Password copied to clipboard!') {
    copyBtn.classList.add('copied');
    copyBtnText.textContent = 'Copied!';
    
    if (toastMessage) {
      toastMessage.textContent = msg;
    }

    // Show toast
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
      copyBtn.classList.remove('copied');
      copyBtnText.textContent = 'Copy password';
    }, 1800);
  }

  /**
   * Save user preferences in Chrome Storage or LocalStorage
   */
  function saveSettings() {
    const settings = {
      length: lengthSlider.value,
      uppercase: chkUppercase.checked,
      lowercase: chkLowercase.checked,
      numbers: chkNumbers.checked,
      symbols: chkSymbols.checked,
      excludeAmbiguous: chkExcludeAmbiguous.checked
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ passwordGeneratorSettings: settings });
    } else {
      localStorage.setItem('passwordGeneratorSettings', JSON.stringify(settings));
    }
  }

  /**
   * Save password history
   */
  function saveHistory() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ passwordGeneratorHistory: passwordHistory });
    } else {
      localStorage.setItem('passwordGeneratorHistory', JSON.stringify(passwordHistory));
    }
  }

  /**
   * Load saved user preferences & history
   */
  function loadSettings() {
    const applySettings = (settings) => {
      if (!settings) {
        lengthSlider.value = 24;
        chkUppercase.checked = true;
        chkLowercase.checked = true;
        chkNumbers.checked = true;
        chkSymbols.checked = true;
        chkExcludeAmbiguous.checked = false;
      } else {
        if (settings.length) lengthSlider.value = settings.length;
        if (typeof settings.uppercase === 'boolean') chkUppercase.checked = settings.uppercase;
        if (typeof settings.lowercase === 'boolean') chkLowercase.checked = settings.lowercase;
        if (typeof settings.numbers === 'boolean') chkNumbers.checked = settings.numbers;
        if (typeof settings.symbols === 'boolean') chkSymbols.checked = settings.symbols;
        if (typeof settings.excludeAmbiguous === 'boolean') chkExcludeAmbiguous.checked = settings.excludeAmbiguous;
      }

      // Ensure at least one is checked
      if (!chkUppercase.checked && !chkLowercase.checked && !chkNumbers.checked && !chkSymbols.checked) {
        chkUppercase.checked = true;
        chkLowercase.checked = true;
      }

      updateSliderFill();
      generatePassword();
    };

    const applyHistory = (hist) => {
      if (Array.isArray(hist)) {
        passwordHistory = hist;
      } else {
        passwordHistory = [];
      }
      renderHistory();
    };

    if (typeof chrome !== 'undefined' && chrome.storage) {
      if (chrome.storage.sync) {
        chrome.storage.sync.get(['passwordGeneratorSettings'], (res) => {
          applySettings(res?.passwordGeneratorSettings);
        });
      } else {
        applySettings(null);
      }

      if (chrome.storage.local) {
        chrome.storage.local.get(['passwordGeneratorHistory'], (res) => {
          applyHistory(res?.passwordGeneratorHistory);
        });
      }
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('passwordGeneratorSettings'));
        applySettings(saved);
      } catch (e) {
        applySettings(null);
      }

      try {
        const hist = JSON.parse(localStorage.getItem('passwordGeneratorHistory'));
        applyHistory(hist);
      } catch (e) {
        applyHistory([]);
      }
    }
  }

  // Modal Handlers
  function openHistoryModal() {
    renderHistory();
    historyModal.classList.add('open');
    historyModal.setAttribute('aria-hidden', 'false');
  }

  function closeHistoryModal() {
    historyModal.classList.remove('open');
    historyModal.setAttribute('aria-hidden', 'true');
  }

  // Event Listeners
  lengthSlider.addEventListener('input', () => {
    updateSliderFill();
    generatePassword();
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const len = parseInt(btn.dataset.len, 10);
      lengthSlider.value = len;
      updateSliderFill();
      generatePassword();
    });
  });

  checkboxes.forEach(({ el }) => {
    el.addEventListener('change', () => {
      // Prevent unchecking all checkboxes
      const checkedCount = checkboxes.filter(c => c.el.checked).length;
      if (checkedCount === 0) {
        el.checked = true;
        return;
      }
      generatePassword();
    });
  });

  chkExcludeAmbiguous.addEventListener('change', () => {
    generatePassword();
  });

  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.remove('spinning');
    void refreshBtn.offsetWidth; // Trigger reflow for animation replay
    refreshBtn.classList.add('spinning');
    generatePassword();
  });

  copyBtn.addEventListener('click', copyPassword);
  passwordDisplay.addEventListener('click', copyPassword);

  // History Event Listeners
  historyBtn.addEventListener('click', openHistoryModal);
  closeHistoryBtn.addEventListener('click', closeHistoryModal);
  historyBackdrop.addEventListener('click', closeHistoryModal);

  clearHistoryBtn.addEventListener('click', () => {
    passwordHistory = [];
    saveHistory();
    renderHistory();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && historyModal.classList.contains('open')) {
      closeHistoryModal();
    }
  });

  // Initialize
  loadSettings();
})();
