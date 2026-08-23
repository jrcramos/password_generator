# Secure Password Generator - Chrome Extension

A modern, fast, cryptographically secure Chrome extension for generating strong, customized passwords with an intuitive UI matching the reference design.

![Icons](icons/icon-48.png)

## ✨ Features

- **Cryptographically Secure**: Generates truly random characters using `window.crypto.getRandomValues`.
- **Customizable Length**: Smooth slider with live updates (8 to 64 characters, defaulting to 22).
- **Flexible Character Sets**: Toggle Uppercase, Lowercase, Numbers, and Symbols (guaranteeing at least one character from every selected category).
- **Password Strength Analyzer**: Real-time entropy evaluation with dynamic strength bar and shield badge ("Weak", "Medium", "Strong", "Very Strong").
- **Instant 1-Click Copy**: Copy button with feedback animation and toast confirmation.
- **Persistent Preferences**: Remembers your preferred slider length and character options via `chrome.storage`.
- **Multi-size Extension Icons**: Crisp icons in 16x16, 32x32, 48x48, and 128x128.

---

## 🚀 How to Install in Google Chrome

1. Clone or download this repository to your local computer.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select this folder (`password_generator`).
6. Pin the extension to your toolbar for instant 1-click password generation!

---

## 📁 File Structure

- `manifest.json`: Manifest V3 configuration.
- `popup.html`: Extension popup layout.
- `popup.css`: Premium stylesheet and responsive styling.
- `popup.js`: Cryptographic generation logic, Fisher-Yates shuffle, and strength calculator.
- `icons/`: Multi-resolution PNG extension icons (16px, 32px, 48px, 128px).
- `create_icons.py`: Script used to generate pixel-crisp PNG icons.
