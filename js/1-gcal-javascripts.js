
/* ----------------------------------
  
  
    GOOGLE CALENDAR CONNECT 
  
  
    ---------------------------------------*/
function connectGcal(calendarUrl, options = {}) {
  const { submitButton, feedbackElement } = options || {};
  const trimmedUrl = (calendarUrl || '').trim();

  const applyFeedback = (message, tone = 'neutral') => {
    if (!feedbackElement) {
      if (message) {
        console.info('[connectGcal]', message);
      }
      return;
    }

    feedbackElement.textContent = message || '';
    if (!message) {
      feedbackElement.style.color = '#d93025';
      return;
    }

    switch (tone) {
      case 'success':
        feedbackElement.style.color = '#137333';
        break;
      case 'info':
        feedbackElement.style.color = '#1a73e8';
        break;
      default:
        feedbackElement.style.color = '#d93025';
    }
  };

  if (!trimmedUrl) {
    applyFeedback('Please paste a public Google Calendar link.', 'error');
    return;
  }

  if (submitButton) {
    submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Checking…';
  }

  const form = options.form;
  if (form) {
    form.classList.add('is-loading');
  }

  const handleDone = () => {
    if (submitButton) {
      const original = submitButton.dataset.originalText || 'Connect';
      submitButton.disabled = false;
      submitButton.textContent = original;
    }
    if (form) {
      form.classList.remove('is-loading');
    }
  };

  const errorMessages = {
    ical_url_required: 'Please paste a calendar link before connecting.',
    fetch_failed: 'We could not reach that calendar. Double-check the URL and try again.',
    not_ical: 'This link does not appear to be a valid calendar feed.',
    invalid_method: 'Server rejected the request. Please try again.',
    cors_denied: 'This calendar source is not allowed.',
  };

  fetch('/api/v1/grab_ical_basics.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ ical_url: trimmedUrl })
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        const errorKey = data?.error;
        const detail = typeof data?.detail === 'string' ? data.detail : '';
        const baseMessage = errorMessages[errorKey] || 'Unable to verify that calendar feed.';
        const combinedMessage = detail ? `${baseMessage} (${detail})` : baseMessage;
        applyFeedback(combinedMessage, 'error');
        return;
      }

      applyFeedback('Feed verified! Preparing your calendar…', 'success');

      const meta = {
        ...data,
        ical_url: data.ical_url || trimmedUrl
      };

      if (typeof closeTheModal === 'function') {
        try {
          closeTheModal();
        } catch (err) {
          console.debug('[connectGcal] closeTheModal failed:', err);
        }
      }

      const hostElement = document.getElementById('logged-in-view') || document.body;
      if (typeof addNewiCal === 'function') {
        try {
          addNewiCal({ hostTarget: hostElement, meta, icalUrl: meta.ical_url });
        } catch (err) {
          console.error('[connectGcal] addNewiCal failed:', err);
        }
      } else {
        console.warn('[connectGcal] addNewiCal is not defined.');
      }
    })
    .catch((err) => {
      console.error('[connectGcal] Network error:', err);
      applyFeedback('Network error — unable to reach the calendar server.', 'error');
    })
    .finally(handleDone);
}

if (typeof window !== 'undefined') {
  window.connectGcal = connectGcal;
}



/*  ADD CALENDAR BASICS*/


function addNewiCal({ hostTarget, meta = {}, icalUrl = '' } = {}) {
    const hostElement = resolveOverlayHost(hostTarget);

    if (!(hostElement instanceof HTMLElement)) {
        console.warn('[addNewiCal] overlay host not found.');
        return;
    }

    const user = getCurrentUser?.();
    if (!user?.buwana_id) {
        alert('Please log in to connect a calendar.');
        if (typeof sendUpRegistration === 'function') sendUpRegistration();
        return;
    }

    const restoreHostPosition = prepareHostForOverlay(hostElement);

    removeOverlayById('ec-add-calendar-overlay');
    removeOverlayById('ec-add-ical-overlay');

    const overlay = document.createElement('div');
    overlay.id = 'ec-add-ical-overlay';
    overlay.classList.add('main-background');
    Object.assign(overlay.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '20',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        gap: '20px',
        overflowY: 'auto',
        borderRadius: '10px',
        background: 'var(--general-background)'
    });

    const feedTitle = typeof meta?.feed_title === 'string' && meta.feed_title.trim()
        ? meta.feed_title.trim()
        : 'Google Calendar';
    const feedDescription = typeof meta?.description === 'string'
        ? meta.description.trim()
        : '';
    const eventCount = Number.isFinite(meta?.item_count)
        ? Number(meta.item_count)
        : null;
    const sizeKb = Number.isFinite(meta?.size_kb)
        ? Number(meta.size_kb)
        : null;
    const defaultColor = sanitizeHexColor(meta?.default_color || '#d93025', '#d93025');
    const normalizedUrl = sanitizeUrl(meta?.ical_url || icalUrl) || (meta?.ical_url || icalUrl || '');
    const safeTitle = escapeHTML(feedTitle);
    const safeDescription = escapeHTML(feedDescription);
    const summaryParts = [];
    if (eventCount !== null) summaryParts.push(`${eventCount} events detected`);
    if (sizeKb !== null) summaryParts.push(`${sizeKb} KB download`);
    const summaryHtml = summaryParts.length
        ? `<p style="margin:0;color:var(--subdued-text);font-size:0.9rem;">${escapeHTML(summaryParts.join(' · '))}</p>`
        : '';

    const defaultEmoji = sanitizeEmojiInput(meta?.emoji || '📆') || '📆';
    const categoryDefault = (meta?.category || 'other').toLowerCase();
    const visibilityDefault = (meta?.visibility || 'private').toLowerCase();

    const categoryOptions = [
        { value: 'personal', label: 'Personal' },
        { value: 'holidays', label: 'Holidays' },
        { value: 'birthdays', label: 'Birthdays' },
        { value: 'astronomy', label: 'Astronomy' },
        { value: 'migration', label: 'Migration' },
        { value: 'other', label: 'Other' },
    ].map(({ value, label }) => {
        const isSelected = value === categoryDefault;
        return `<option value="${value}"${isSelected ? ' selected' : ''}>${label}</option>`;
    }).join('');

    const visibilityOptions = [
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' }
    ].map(({ value, label }) => {
        const isSelected = value === visibilityDefault;
        return `<option value="${value}"${isSelected ? ' selected' : ''}>${label}</option>`;
    }).join('');

    overlay.innerHTML = `
        <div class="ec-add-calendar-header" style="display:flex;flex-direction:column;gap:8px;">
            <h2 style="margin:0;font-size:1.5rem;">Add Google Calendar</h2>
            <p style="margin:0;color:var(--subdued-text);font-size:0.95rem;">
                Customize how <strong>${safeTitle}</strong> should appear in your Earthcal.
            </p>
            ${summaryHtml}
        </div>
        <form id="ec-add-ical-form" style="display:flex;flex-direction:column;gap:16px;width:100%;max-width:100%;">
            <input type="hidden" id="ec-ical-url" name="ical_url" value="${escapeAttr(normalizedUrl)}">
            <div style="display:flex;flex-direction:column;width:100%;">
                <label class="ec-visually-hidden" for="ec-cal-name">Calendar name</label>
                <input id="ec-cal-name" name="calendar_name" type="text" placeholder="Name your new calendar..." required
                       aria-label="Calendar name"
                       value="${escapeAttr(feedTitle)}"
                       style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;flex-direction:column;width:100%;">
                <label class="ec-visually-hidden" for="ec-cal-description">Description</label>
                <input id="ec-cal-description" name="calendar_description" type="text"
                       placeholder="Describe what this calendar is for"
                       aria-label="Calendar description"
                       value="${escapeAttr(feedDescription)}"
                       style="padding:10px;border-radius:8px;border:1px solid grey;font-weight:400;background:var(--top-header);width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;width:100%;">
                <div style="flex:1 1 200px;display:flex;flex-direction:column;min-width:min(200px,100%);">
                    <label class="ec-visually-hidden" for="ec-cal-category">Calendar category</label>
                    <select id="ec-cal-category" name="calendar_category"
                            aria-label="Calendar category"
                            style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;">
                        <option value="" disabled>Select calendar category...</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="ec-inline-field ec-emoji-field" style="width:auto;">
                    <div class="ec-emoji-input">
                        <button type="button" id="ec-cal-emoji-button" class="blur-form-field ec-emoji-button"
                                aria-haspopup="true" aria-expanded="false" aria-label="Choose calendar emoji"
                                style="width:45px;height:45px;display:flex;align-items:center;justify-content:center;">
                            <span id="ec-cal-emoji-preview" class="ec-emoji-preview">${escapeHTML(defaultEmoji)}</span>
                        </button>
                        <input type="hidden" id="ec-cal-emoji" name="calendar_emoji" value="${escapeAttr(defaultEmoji)}">
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;width:100%;">
                <div style="flex:1 1 200px;display:flex;flex-direction:column;min-width:min(200px,100%);">
                    <label class="ec-visually-hidden" for="ec-cal-visibility">Visibility</label>
                    <select id="ec-cal-visibility" name="calendar_visibility"
                            aria-label="Calendar visibility"
                            style="padding:10px;border-radius:8px;border:1px solid var(--subdued-text, #d1d5db);font-weight:400;width:100%;box-sizing:border-box;">
                        ${visibilityOptions}
                    </select>
                </div>
                <div class="ec-inline-field ec-color-field" style="width:auto;display:flex;align-items:center;">
                    <input id="ec-cal-color" name="calendar_color" type="color" value="${escapeAttr(defaultColor)}"
                           class="blur-form-field ec-color-input" aria-label="Calendar color"
                           style="width:40px;height:40px;padding:0;">
                </div>
            </div>
            <div class="ec-add-calendar-actions" style="margin-top:8px;display:flex;">
                <button type="submit" class="stellar-submit">Add calendar</button>
            </div>
        </form>
    `;

    hostElement.appendChild(overlay);

    overlay.dataset.icalUrl = normalizedUrl;
    overlay.dataset.feedTitle = feedTitle;

    const cleanupFns = [];

    const detachEmojiPicker = wireEmojiPicker({
        buttonId: 'ec-cal-emoji-button',
        hiddenInputId: 'ec-cal-emoji',
        previewId: 'ec-cal-emoji-preview',
        defaultEmoji
    });
    cleanupFns.push(detachEmojiPicker);

    let closed = false;
    const teardownOverlay = () => {
        if (closed) return;
        closed = true;
        while (cleanupFns.length) {
            const fn = cleanupFns.shift();
            try { fn && fn(); } catch (err) { console.debug('[addNewiCal] cleanup failed:', err); }
        }
        if (overlay.parentElement) overlay.remove();
        restoreHostPosition();
        delete overlay.__ecTeardown;
    };
    overlay.__ecTeardown = teardownOverlay;

    const detachCloseButton = hijackHostCloseButton(hostElement, teardownOverlay);
    cleanupFns.push(detachCloseButton);

    const form = overlay.querySelector('#ec-add-ical-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Saving Google Calendar connections is coming soon!');
        });
    }

    const nameField = overlay.querySelector('#ec-cal-name');
    if (nameField) {
        nameField.focus();
        nameField.select();
    }
}