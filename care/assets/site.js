(function () {
  const toast = document.querySelector("[data-toast]");
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(window.__yl8ToastTimer);
    window.__yl8ToastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
  };

  document.querySelectorAll("[data-start-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      showToast("正式版这里接入父母养老画像测评入口，不再使用空链接。");
    });
  });

  document.querySelectorAll("[data-tile]").forEach((tile) => {
    tile.addEventListener("click", () => {
      document.querySelectorAll("[data-tile]").forEach((item) => item.classList.remove("active"));
      tile.classList.add("active");
      showToast(`已选择：${tile.dataset.tile}。可带入画像测评或进入对应专题。`);
    });
  });

  const checks = Array.from(document.querySelectorAll("[data-check-item]"));
  const doneCount = document.querySelector("[data-done-count]");
  const totalCount = document.querySelector("[data-total-count]");
  const meter = document.querySelector("[data-meter-fill]");
  const updateProgress = () => {
    if (!checks.length) return;
    const done = checks.filter((item) => item.checked).length;
    if (doneCount) doneCount.textContent = String(done);
    if (totalCount) totalCount.textContent = String(checks.length);
    if (meter) meter.style.width = `${Math.round((done / checks.length) * 100)}%`;
  };
  checks.forEach((item) => item.addEventListener("change", updateProgress));
  updateProgress();

  const quizOptions = Array.from(document.querySelectorAll("[data-risk-option]"));
  const riskLevel = document.querySelector("[data-risk-level]");
  const riskFocus = document.querySelector("[data-risk-focus]");
  const riskAction = document.querySelector("[data-risk-action]");
  quizOptions.forEach((option) => {
    option.addEventListener("click", () => {
      quizOptions.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      if (riskLevel) riskLevel.textContent = option.dataset.level || "中风险";
      if (riskFocus) riskFocus.textContent = option.dataset.focus || "夜间动线和卫生间";
      if (riskAction) riskAction.textContent = option.dataset.action || "先处理一处最常发生的场景";
      showToast("已更新右侧风险地图。正式版会继续进入 12 题自查。");
    });
  });
})();
