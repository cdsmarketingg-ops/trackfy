(function() {
  const API_URL = window.location.origin; // Assuming the pixel is hosted on the same domain as the tracker

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  const captureUtms = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const utms = ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'];
    const params = {};
    utms.forEach(utm => {
      const val = urlParams.get(utm);
      if (val) params[utm] = val;
    });
    return params;
  };

  const initSession = async () => {
    const params = captureUtms();
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/init-session?${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.sessionId;
  };

  const trackEvent = async (eventName, customData = {}) => {
    const sessionId = getCookie('utmify_session');
    if (!sessionId) {
      // Session might not be initialized yet, wait and retry
      setTimeout(() => trackEvent(eventName, customData), 1000);
      return;
    }

    await fetch(`${API_URL}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        session_id: sessionId,
        url: window.location.href,
        user_data: {
          user_agent: navigator.userAgent,
          // IP is handled server-side
        },
        ...customData
      })
    });
  };

  // Initial load
  initSession().then(() => {
    trackEvent('PageView');
  });

  // Expose to window
  window.utmify = {
    track: trackEvent
  };
})();
