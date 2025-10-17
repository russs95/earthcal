
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
