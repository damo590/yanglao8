(function initPolicyPage() {
  const runtime = window.PolicyServiceRuntime;
  const POLICY_API = "/api/policies";
  const POLICY_AI_QUERY_API = "/api/policy-query";
  const LOCAL_POLICY_ITEMS = "/scripts/output/subsidies-all.json";

  const DB_CATEGORY_TO_UI = {
    高龄津贴: "monthly_money",
    低保相关: "monthly_money",
    残疾人补贴: "monthly_money",
    长护险: "home_care",
    失能补贴: "home_care",
    养老服务补贴: "home_care",
    其他: "community"
  };

  const CITY_TO_REGION = {
    长沙: "changsha",
    北京: "beijing",
    上海: "shanghai"
  };

  const REGION_LABELS = {
    changsha: "长沙",
    beijing: "北京",
    shanghai: "上海",
    all: "全部地区"
  };

  const state = {
    selectedRegion: "changsha",
    selectedCategory: "all",
    query: "",
    policies: [],
    policiesById: new Map(),
    requestSeq: 0,
    aiRequestSeq: 0,
    usingFallback: false
  };

  const ui = {
    browserPolicyList: document.getElementById("browserPolicyList"),
    emptyState: document.getElementById("policyEmptyState"),
    searchInput: document.getElementById("policySearchInput"),
    drawer: document.getElementById("policyDetailDrawer"),
    drawerContent: document.getElementById("drawerContent"),
    drawerCloseBtn: document.getElementById("drawerCloseBtn"),
    toast: document.getElementById("policyToast"),
    districtTitle: document.getElementById("districtTitle"),
    dataStatus: document.getElementById("policyDataStatus"),
    panelCount: document.getElementById("policyPanelCount"),
    panelRegion: document.getElementById("policyPanelRegion"),
    quickRegionSelect: document.getElementById("quickRegionSelect"),
    quickCategorySelect: document.getElementById("quickCategorySelect"),
    quickSearchInput: document.getElementById("quickPolicySearchInput"),
    quickQueryBtn: document.getElementById("quickQueryBtn"),
    policyAiResult: document.getElementById("policyAiResult"),
    policyBrowser: document.getElementById("policyBrowser")
  };

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cleanText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function arrayFrom(value) {
    return Array.isArray(value) ? value.filter(Boolean).map(cleanText) : [];
  }

  function categoryToUiCategory(category) {
    return DB_CATEGORY_TO_UI[category] || "community";
  }

  function statusLabel(confidence) {
    if (confidence === "high") return "较高可信";
    if (confidence === "medium") return "待核实";
    return "待补充";
  }

  function verificationLevel(confidence) {
    if (confidence === "high") return "较高可信";
    if (confidence === "medium") return "需社区确认";
    return "待补充核实";
  }

  function buildSuitableFor(row) {
    const parts = [];
    if (row.age_min) parts.push(`${row.age_min} 岁及以上`);
    if (row.age_max) parts.push(`${row.age_max} 岁及以下`);
    const careLevels = arrayFrom(row.care_levels);
    if (careLevels.length) parts.push(`照护情况：${careLevels.join("、")}`);
    if (row.income_type && row.income_type !== "不限") parts.push(`收入身份：${row.income_type}`);
    if (row.hukou_type && row.hukou_type !== "不限") parts.push(`户籍：${row.hukou_type}`);
    return parts.length ? `${parts.join("，")}的老人或家庭优先确认。` : "符合当地政策条件的老人或家庭可以先向社区确认。";
  }

  function stablePolicyId(row) {
    if (row.id) return `subsidy-${String(row.id).replace(/[^a-zA-Z0-9-]/g, "")}`;
    return `subsidy-${encodeURIComponent(`${row.city || ""}-${row.name || ""}`).slice(0, 60)}`;
  }

  function normalizeSubsidyRow(row) {
    const city = cleanText(row.city);
    const name = cleanText(row.name);
    const amount = cleanText(row.amount);
    const category = cleanText(row.category);
    const applyChannel = cleanText(row.apply_channel);
    const year = Number(row.policy_year || 0);
    const materials = arrayFrom(row.materials);
    const eligibility = arrayFrom(row.eligibility);
    const notes = cleanText(row.notes);

    return {
      id: stablePolicyId(row),
      userTitle: name.startsWith(city) ? name : `${city}${name}`,
      officialTitle: name,
      category: categoryToUiCategory(category),
      rawCategory: category,
      region: CITY_TO_REGION[city] || city,
      regionLabel: city,
      status: statusLabel(row.confidence),
      benefit: amount ? `符合条件后，可能获得${name}：${amount}。` : `符合条件后，可能申请${name}。`,
      suitableFor: buildSuitableFor(row),
      conditions: eligibility.length ? eligibility : ["以当地社区、民政或医保窗口审核条件为准"],
      missingInfoHints: [
        "户籍地、居住地或参保地是否符合",
        "当前年度是否仍按该标准执行",
        applyChannel ? `是否需要到${applyChannel}办理` : "当地是否有线上或线下办理入口"
      ],
      materialsRequired: materials.length ? materials : ["老人身份证", "户口簿或居住材料", "经办窗口要求的申请表"],
      materialsOptional: ["代办人身份证", "银行卡或社保卡", "评估报告或低保证明等身份材料"],
      applicationSteps: [
        `先向${applyChannel || "户籍或居住地社区"}确认最新条件`,
        "按窗口要求准备身份证明、户籍或参保材料",
        "提交申请或登记信息",
        "等待审核，并确认发放方式或服务安排"
      ],
      officialSourceUrl: cleanText(row.apply_url) || "https://yanglao8.com/policy/",
      lastVerifiedAt: year ? `${year} 年政策项` : "待补充年份",
      verificationLevel: verificationLevel(row.confidence),
      synonyms: [name, category, city, amount, notes].filter(Boolean),
      tags: [categoryToUiCategory(category), category, city].filter(Boolean),
      riskNotice: "本页面提供政策信息整理和初步匹配，不代表政府部门最终审核结果。补贴标准、申请条件和办理流程可能因地区、时间和个人情况发生变化，请以当地主管部门最新规定为准。"
    };
  }

  function regionMatches(policy, region) {
    if (!region || region === "all") return true;
    return policy.region === region || policy.regionLabel === REGION_LABELS[region];
  }

  function filterPoliciesLocally(policies) {
    const query = state.query.toLowerCase();
    return policies.filter((policy) => {
      if (state.selectedCategory !== "all" && policy.category !== state.selectedCategory) return false;
      if (!regionMatches(policy, state.selectedRegion)) return false;
      if (!query) return true;
      return [
        policy.userTitle,
        policy.officialTitle,
        policy.benefit,
        policy.suitableFor,
        policy.regionLabel,
        ...(policy.synonyms || [])
      ].join(" ").toLowerCase().includes(query);
    });
  }

  function setPolicies(policies) {
    state.policies = policies;
    state.policiesById = new Map(policies.map((policy) => [policy.id, policy]));
  }

  function updateSummary() {
    const regionLabel = REGION_LABELS[state.selectedRegion] || "当前地区";
    if (ui.districtTitle) ui.districtTitle.textContent = `当前查询地区：${regionLabel}`;
    if (ui.panelCount) ui.panelCount.textContent = `当前条件找到 ${state.policies.length} 项相关政策。`;
    if (ui.panelRegion) ui.panelRegion.textContent = `当前地区：${regionLabel}`;
    if (ui.dataStatus) {
      ui.dataStatus.textContent = "已读取政策项。";
    }
    syncQuickControls();
  }

  function renderLoading() {
    ui.browserPolicyList.innerHTML = `
      <article class="policy-card loading-card">
        <div class="policy-card-head">
          <h3>正在读取政策项</h3>
          <span class="policy-status">读取中</span>
        </div>
        <p>正在按地区、需求和关键词整理政策列表。</p>
      </article>
    `;
    ui.emptyState.hidden = true;
    if (ui.dataStatus) ui.dataStatus.textContent = "正在读取政策项。";
  }

  function renderPolicyList(container, policies) {
    container.innerHTML = policies.map((policy) => `
      <article class="policy-card">
        <div class="policy-card-head">
          <h3>${escapeHtml(policy.userTitle)}</h3>
          <span class="policy-status">${escapeHtml(policy.status)}</span>
        </div>
        <p>${escapeHtml(policy.benefit)}</p>
        <div class="policy-meta">
          <span><strong>适用地区：</strong>${escapeHtml(policy.regionLabel)}</span>
          <span><strong>适合情况：</strong>${escapeHtml(policy.suitableFor)}</span>
          <span><strong>最后核实：</strong>${escapeHtml(policy.lastVerifiedAt)} · ${escapeHtml(policy.verificationLevel)}</span>
        </div>
        <button class="btn-secondary" type="button" data-policy-id="${escapeHtml(policy.id)}">查看申请步骤</button>
      </article>
    `).join("");
  }

  function renderBrowser() {
    renderPolicyList(ui.browserPolicyList, state.policies);
    ui.emptyState.hidden = state.policies.length > 0;
    updateSummary();
  }

  function setQuickQueryBusy(isBusy) {
    if (!ui.quickQueryBtn) return;
    ui.quickQueryBtn.disabled = isBusy;
    ui.quickQueryBtn.textContent = isBusy ? "正在查询" : "开始查询";
  }

  function clearPolicyAiResult() {
    if (!ui.policyAiResult) return;
    ui.policyAiResult.hidden = true;
    ui.policyAiResult.className = "policy-ai-result";
    ui.policyAiResult.innerHTML = "";
  }

  function renderPolicyAiLoading() {
    if (!ui.policyAiResult) return;
    ui.policyAiResult.hidden = false;
    ui.policyAiResult.className = "policy-ai-result loading";
    ui.policyAiResult.innerHTML = `
      <div class="policy-ai-eyebrow">DeepSeek 解答</div>
      <h3>正在生成查询结果</h3>
      <p>正在根据当前地区、补贴类型和你的问题，生成政策解答和行动清单。</p>
    `;
  }

  function renderPolicyAiError(message) {
    if (!ui.policyAiResult) return;
    ui.policyAiResult.hidden = false;
    ui.policyAiResult.className = "policy-ai-result error";
    ui.policyAiResult.innerHTML = `
      <div class="policy-ai-eyebrow">查询结果整理未完成</div>
      <h3>已先展示本地政策列表</h3>
      <p>${escapeHtml(message || "AI整理暂时不可用，可以先查看下方政策卡片，并向社区或主管部门确认。")}</p>
    `;
  }

  function renderPolicyAiList(title, items, ordered) {
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!safeItems.length) return "";
    const tag = ordered ? "ol" : "ul";
    return `
      <div class="policy-ai-block">
        <strong>${escapeHtml(title)}</strong>
        <${tag}>${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>
      </div>
    `;
  }

  function renderPolicyAiResult(advice) {
    if (!ui.policyAiResult) return;
    ui.policyAiResult.hidden = false;
    ui.policyAiResult.className = "policy-ai-result";
    ui.policyAiResult.innerHTML = `
      <div class="policy-ai-eyebrow">DeepSeek 解答</div>
      <h3>按当前问题生成的查询结果</h3>
      <p>${escapeHtml(advice.summary || "已根据当前条件整理出可能相关的政策和下一步确认方向。")}</p>
      <div class="policy-ai-grid">
        ${renderPolicyAiList("可能相关政策", advice.likely_matches)}
        ${renderPolicyAiList("优先行动", advice.priority_actions, true)}
        ${renderPolicyAiList("先准备材料", advice.materials_to_prepare)}
        ${renderPolicyAiList("向社区确认", advice.verification_questions)}
      </div>
      <p class="policy-ai-risk">${escapeHtml(advice.risk_notice || "仅作政策信息整理和初步匹配，不代表政府部门最终审核结果。")}</p>
    `;
  }

  function policyContextForAi() {
    return state.policies.slice(0, 6).map((policy) => ({
      userTitle: policy.userTitle,
      benefit: policy.benefit,
      suitableFor: policy.suitableFor,
      status: policy.status,
      regionLabel: policy.regionLabel,
      materialsRequired: policy.materialsRequired,
      applicationSteps: policy.applicationSteps,
      officialSourceUrl: policy.officialSourceUrl
    }));
  }

  async function fetchPolicyAiResult(seq) {
    renderPolicyAiLoading();
    const response = await fetch(POLICY_AI_QUERY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region: state.selectedRegion,
        category: state.selectedCategory,
        keyword: state.query,
        policies: policyContextForAi()
      })
    });
    const payload = await response.json().catch(() => null);
    if (seq !== state.aiRequestSeq) return;

    if (!response.ok || !payload || payload.ok !== true) {
      const error = payload && payload.error;
      const message = error === "deepseek_not_configured"
        ? "DeepSeek API Key 还没有进入生产环境。请确认 Vercel 环境变量 DEEPSEEK_API_KEY 已配置，并重新部署。"
        : "AI整理暂时不可用，已先保留下方本地政策列表。";
      renderPolicyAiError(message);
      return;
    }
    renderPolicyAiResult(payload.advice || {});
  }

  async function fetchApiPolicies() {
    const params = new URLSearchParams({
      region: state.selectedRegion,
      category: state.selectedCategory,
      query: state.query
    });
    const response = await fetch(`${POLICY_API}?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("policy_api_unavailable");
    const payload = await response.json();
    if (!payload || payload.ok !== true || !Array.isArray(payload.policies)) throw new Error("policy_api_invalid");
    return payload.policies;
  }

  async function fetchLocalPolicyItems() {
    const response = await fetch(LOCAL_POLICY_ITEMS, { cache: "no-store" });
    if (!response.ok) throw new Error("local_policy_items_unavailable");
    const rows = await response.json();
    return filterPoliciesLocally(rows.map(normalizeSubsidyRow));
  }

  function fallbackRuntimePolicies() {
    if (!runtime || typeof runtime.filterPolicies !== "function") return [];
    return runtime.filterPolicies({
      category: state.selectedCategory,
      region: state.selectedRegion,
      query: state.query
    });
  }

  async function loadPolicies() {
    const seq = ++state.requestSeq;
    renderLoading();

    try {
      const policies = await fetchApiPolicies();
      if (seq !== state.requestSeq) return;
      state.usingFallback = false;
      setPolicies(policies);
      renderBrowser();
      return;
    } catch (error) {
      try {
        const policies = await fetchLocalPolicyItems();
        if (seq !== state.requestSeq) return;
        state.usingFallback = true;
        setPolicies(policies);
        renderBrowser();
        return;
      } catch (fallbackError) {
        if (seq !== state.requestSeq) return;
        state.usingFallback = true;
        setPolicies(fallbackRuntimePolicies());
        renderBrowser();
      }
    }
  }

  function listItems(items) {
    return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function openPolicyDetail(policyId) {
    const policy = state.policiesById.get(policyId) || (runtime && runtime.getPolicyById ? runtime.getPolicyById(policyId) : null);
    if (!policy) return;
    ui.drawerContent.innerHTML = `
      <h2 id="drawerTitle">${escapeHtml(policy.userTitle)}</h2>
      <p>${escapeHtml(policy.officialTitle)}</p>
      <div class="policy-meta">
        <span><strong>适用地区：</strong>${escapeHtml(policy.regionLabel)}</span>
        <span><strong>政策状态：</strong>${escapeHtml(policy.status)}</span>
        <span><strong>最后核实：</strong>${escapeHtml(policy.lastVerifiedAt)} · ${escapeHtml(policy.verificationLevel)}</span>
      </div>
      <div class="drawer-section"><h3>你能获得什么</h3><p>${escapeHtml(policy.benefit)}</p></div>
      <div class="drawer-section"><h3>哪些人可能符合</h3><ul>${listItems(policy.conditions)}</ul></div>
      <div class="drawer-section"><h3>你家还需要确认什么</h3><ul>${listItems(policy.missingInfoHints)}</ul></div>
      <div class="drawer-section"><h3>必须准备</h3><ul>${listItems(policy.materialsRequired)}</ul></div>
      <div class="drawer-section"><h3>可能需要</h3><ul>${listItems(policy.materialsOptional)}</ul></div>
      <div class="drawer-section"><h3>办理流程</h3><ol>${listItems(policy.applicationSteps)}</ol></div>
      <div class="drawer-section"><h3>官方来源</h3><p><a href="${escapeHtml(policy.officialSourceUrl)}" target="_blank" rel="noopener">即将前往政府或官方服务平台</a></p></div>
      <div class="drawer-section"><h3>风险提示</h3><p>${escapeHtml(policy.riskNotice)}</p></div>
    `;
    ui.drawer.hidden = false;
    ui.drawer.setAttribute("aria-hidden", "false");
  }

  function closePolicyDetail() {
    ui.drawer.hidden = true;
    ui.drawer.setAttribute("aria-hidden", "true");
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => ui.toast.classList.remove("show"), 2600);
  }

  function debounceLoad() {
    window.clearTimeout(debounceLoad.timer);
    debounceLoad.timer = window.setTimeout(loadPolicies, 180);
  }

  function syncQuickControls() {
    if (ui.quickRegionSelect && ui.quickRegionSelect.value !== state.selectedRegion) {
      ui.quickRegionSelect.value = state.selectedRegion;
    }
    if (ui.quickCategorySelect && ui.quickCategorySelect.value !== state.selectedCategory) {
      ui.quickCategorySelect.value = state.selectedCategory;
    }
    if (ui.quickSearchInput && ui.quickSearchInput.value !== state.query) {
      ui.quickSearchInput.value = state.query;
    }
  }

  function syncFilterControls() {
    document.querySelectorAll("[data-region]").forEach((button) => {
      button.classList.toggle("active", button.dataset.region === state.selectedRegion);
    });
    document.querySelectorAll("[data-category]").forEach((button) => {
      button.classList.toggle("active", button.dataset.category === state.selectedCategory);
    });
    if (ui.searchInput.value !== state.query) {
      ui.searchInput.value = state.query;
    }
  }

  async function applyQuickQuery() {
    const aiSeq = ++state.aiRequestSeq;
    state.selectedRegion = ui.quickRegionSelect.value;
    state.selectedCategory = ui.quickCategorySelect.value;
    state.query = ui.quickSearchInput.value;
    clearPolicyAiResult();
    syncFilterControls();
    setQuickQueryBusy(true);
    try {
      await loadPolicies();
      if (ui.policyBrowser) ui.policyBrowser.scrollIntoView({ behavior: "smooth", block: "start" });
      await fetchPolicyAiResult(aiSeq);
      showToast("已按自助查询条件整理政策结果。");
    } catch (error) {
      renderPolicyAiError("查询整理暂时失败，已保留下方政策列表。");
    } finally {
      if (aiSeq === state.aiRequestSeq) setQuickQueryBusy(false);
    }
  }

  document.addEventListener("click", (event) => {
    const detailButton = event.target.closest("[data-policy-id]");
    if (detailButton) openPolicyDetail(detailButton.dataset.policyId);

    const districtButton = event.target.closest("[data-region]");
    if (districtButton) {
      state.selectedRegion = districtButton.dataset.region;
      clearPolicyAiResult();
      document.querySelectorAll("[data-region]").forEach((button) => button.classList.toggle("active", button === districtButton));
      loadPolicies();
      showToast("已按地区更新政策列表。");
    }

    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      state.selectedCategory = categoryButton.dataset.category;
      clearPolicyAiResult();
      document.querySelectorAll("[data-category]").forEach((button) => button.classList.toggle("active", button === categoryButton));
      loadPolicies();
    }
  });

  ui.searchInput.addEventListener("input", () => {
    state.query = ui.searchInput.value;
    clearPolicyAiResult();
    debounceLoad();
  });

  ui.quickQueryBtn.addEventListener("click", applyQuickQuery);
  ui.quickSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") applyQuickQuery();
  });

  ui.drawerCloseBtn.addEventListener("click", closePolicyDetail);
  ui.drawer.addEventListener("click", (event) => {
    if (event.target === ui.drawer) closePolicyDetail();
  });

  loadPolicies();
})();
