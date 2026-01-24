// content.js - Injects script and listens for events

(function() {
  'use strict';

  console.log(' Content script starting...');

  // Check if extension context is still valid
  function isExtensionContextValid() {
    try {
      return chrome.runtime && chrome.runtime.id != null;
    } catch (e) {
      return false;
    }
  }

  // Inject our script into the page
  if (!isExtensionContextValid()) {
    console.log(' Extension context invalid, skipping injection');
    return;
  }

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = function() {
    console.log('Injected script loaded');
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Inject badge styles
  function injectBadgeStyles() {
    if (document.getElementById('giitcode-badge-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'giitcode-badge-styles';
    styles.textContent = `
      @keyframes giitcode-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes giitcode-pulse {
        0%, 100% {
          box-shadow: 0 4px 20px rgba(45, 164, 78, 0.4);
        }
        50% {
          box-shadow: 0 4px 30px rgba(45, 164, 78, 0.7);
        }
      }

      @keyframes giitcode-checkmark {
        0% {
          transform: scale(0) rotate(-45deg);
        }
        50% {
          transform: scale(1.2) rotate(0deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }

      @keyframes giitcode-fade-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      #giitcode-badge {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        animation: giitcode-slide-in 0.4s ease-out, giitcode-pulse 2s ease-in-out infinite;
      }

      #giitcode-badge.hiding {
        animation: giitcode-fade-out 0.3s ease-in forwards;
      }

      #giitcode-badge-container {
        display: flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, #2da44e 0%, #238636 100%);
        color: white;
        padding: 14px 20px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 20px rgba(45, 164, 78, 0.4);
      }

      #giitcode-badge-container:hover {
        transform: scale(1.03);
        box-shadow: 0 6px 25px rgba(45, 164, 78, 0.5);
      }

      #giitcode-badge-checkmark {
        width: 32px;
        height: 32px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: giitcode-checkmark 0.5s ease-out 0.2s both;
      }

      #giitcode-badge-checkmark svg {
        width: 20px;
        height: 20px;
        color: #2da44e;
      }

      #giitcode-badge-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      #giitcode-badge-title {
        font-weight: 700;
        font-size: 15px;
        letter-spacing: -0.2px;
      }

      #giitcode-badge-subtitle {
        font-size: 12px;
        opacity: 0.9;
      }

      #giitcode-badge-close {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 22px;
        height: 22px;
        background: #24292e;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        opacity: 0;
      }

      #giitcode-badge:hover #giitcode-badge-close {
        opacity: 1;
      }

      #giitcode-badge-close:hover {
        background: #d73a49;
        transform: scale(1.1);
      }

      #giitcode-badge-close svg {
        width: 12px;
        height: 12px;
        color: white;
      }

      #giitcode-badge-problem {
        font-size: 11px;
        opacity: 0.85;
        margin-top: 2px;
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(styles);
  }

  // Create and show the success badge
  function showSuccessBadge(submissionData) {
    // Remove existing badge if present
    const existingBadge = document.getElementById('giitcode-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    injectBadgeStyles();

    const badge = document.createElement('div');
    badge.id = 'giitcode-badge';
    badge.innerHTML = `
      <div id="giitcode-badge-container">
        <div id="giitcode-badge-checkmark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div id="giitcode-badge-content">
          <div id="giitcode-badge-title">Solution Accepted!</div>
          <div id="giitcode-badge-subtitle">Click to commit to GitHub</div>
          <div id="giitcode-badge-problem">${submissionData.problemTitle || 'Problem Solved'}</div>
        </div>
      </div>
      <div id="giitcode-badge-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    `;

    document.body.appendChild(badge);

    // Handle click on main badge - show instruction or attempt to open popup
    const container = badge.querySelector('#giitcode-badge-container');
    container.addEventListener('click', function(e) {
      e.stopPropagation();
      // Show a brief tooltip indicating to click the extension icon
      showExtensionHint();
    });

    // Handle close button
    const closeBtn = badge.querySelector('#giitcode-badge-close');
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      badge.classList.add('hiding');
      setTimeout(() => badge.remove(), 300);
    });

    // Auto-hide after 30 seconds
    setTimeout(() => {
      if (document.getElementById('giitcode-badge')) {
        badge.classList.add('hiding');
        setTimeout(() => badge.remove(), 300);
      }
    }, 30000);
  }

  // Show hint to click extension icon
  function showExtensionHint() {
    const existingHint = document.getElementById('giitcode-hint');
    if (existingHint) existingHint.remove();

    const hint = document.createElement('div');
    hint.id = 'giitcode-hint';
    hint.style.cssText = `
      position: fixed;
      top: 60px;
      right: 24px;
      z-index: 999999;
      background: #24292e;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: giitcode-slide-in 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    hint.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="17 1 21 5 17 9"></polyline>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
      </svg>
      <span>Click the <strong>GiitCode</strong> extension icon in your toolbar to commit!</span>
    `;

    document.body.appendChild(hint);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (hint.parentNode) {
        hint.style.animation = 'giitcode-fade-out 0.3s ease-in forwards';
        setTimeout(() => hint.remove(), 300);
      }
    }, 4000);
  }

  // Listen for events from injected script
  window.addEventListener('leetcodeAccepted', function(event) {
    // Check context before sending message
    if (!isExtensionContextValid()) {
      console.log('Extension context invalidated, please refresh the page');
      return;
    }

    console.log('📬 Received submission from page:', event.detail);

    // Show success badge
    showSuccessBadge(event.detail);

    // Send to background script
    try {
      chrome.runtime.sendMessage({
        action: 'submissionDetected',
        data: event.detail
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        } else {
          console.log(' Sent to background successfully');
        }
      });
    } catch (e) {
      console.log('Extension context invalidated, please refresh the page');
    }
  });

  console.log('Event listeners set up');
})();
