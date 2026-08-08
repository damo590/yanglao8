(function initYanglao8Analytics() {
  window.va = window.va || function queueVercelAnalytics() {
    (window.vaq = window.vaq || []).push(arguments);
  };

  window.yanglao8Track = function yanglao8Track(name, data) {
    if (!name) return;
    try {
      window.va("event", {
        name: String(name).slice(0, 80),
        data: data && typeof data === "object" ? data : {}
      });
    } catch (error) {
      // Analytics must never interrupt a user flow.
    }
  };

  document.addEventListener("click", function trackDeclaredClick(event) {
    const target = event.target.closest("[data-analytics-event]");
    if (!target) return;
    window.yanglao8Track(target.dataset.analyticsEvent, {
      source: target.dataset.analyticsSource || "unknown",
      path: window.location.pathname
    });
  });
})();
