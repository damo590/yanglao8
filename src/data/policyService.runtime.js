(function initPolicyServiceRuntime(root, factory) {
  const runtime = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = runtime;
  }
  root.PolicyServiceRuntime = runtime;
})(typeof globalThis !== "undefined" ? globalThis : window, function createPolicyServiceRuntime() {
  const categories = [
    { id: "monthly_money", title: "老人每月能领的钱", desc: "高龄津贴、养老服务补贴、护理补贴、低保救助" },
    { id: "home_care", title: "老人需要照护", desc: "长期护理保险、能力评估、上门照护、助餐助浴" },
    { id: "home_modification", title: "家里需要改造", desc: "居家适老化改造、无障碍改造、困难老人家庭改造" },
    { id: "medical", title: "看病和康复支持", desc: "医疗救助、家庭医生、异地就医、康复护理" },
    { id: "community", title: "养老机构和社区服务", desc: "社区养老服务、老年助餐、日间照料、探访关爱" },
    { id: "caregiver", title: "子女照顾父母", desc: "赡养老人扣除、护理假、家庭照护培训、喘息服务" }
  ];

  const policies = [
    {
      id: "xiangyin-advanced-age-allowance",
      userTitle: "湘阴县高龄老人津贴申请方向",
      officialTitle: "高龄老人津贴相关政策",
      category: "monthly_money",
      region: "xiangyin",
      regionLabel: "湖南省 岳阳市 湘阴县",
      status: "部分核实",
      benefit: "符合当地年龄和户籍要求的老人，可能可申请高龄津贴。",
      suitableFor: "80 岁及以上，且户籍在当地的老人优先确认。",
      conditions: ["年龄达到当地高龄津贴门槛", "户籍地属于当地", "政策当前有效"],
      missingInfoHints: ["是否需要主动申请", "是否已经自动发放", "社保卡金融账户是否可用"],
      materialsRequired: ["老人身份证", "户口簿", "社保卡", "社区要求的申请表"],
      materialsOptional: ["代办人身份证", "银行账户信息"],
      applicationSteps: ["向户籍所在地社区确认年龄门槛", "准备身份证、户口簿和社保卡", "按社区要求提交申请或确认免申即享", "等待审核并确认发放方式"],
      officialSourceUrl: "https://www.xiangyin.gov.cn/",
      lastVerifiedAt: "2026-07-02",
      verificationLevel: "部分核实",
      synonyms: ["高龄补贴", "高龄津贴", "老人年龄补贴"],
      tags: ["monthly_money", "age", "household"],
      riskNotice: "本页面提供政策信息整理和初步匹配，不代表政府部门最终审核结果。补贴标准、申请条件和办理流程可能因地区、时间和个人情况发生变化，请以当地主管部门最新规定为准。"
    },
    {
      id: "hunan-elderly-service-consumption-subsidy",
      userTitle: "湖南中度以上失能老人养老服务消费补贴方向",
      officialTitle: "湖南省中度以上失能老年人养老服务消费补贴相关政策",
      category: "home_care",
      region: "hunan",
      regionLabel: "湖南省",
      status: "待核实",
      benefit: "经评估符合条件后，可能获得养老服务消费补贴或服务支持。",
      suitableFor: "生活能力明显下降、需要照护服务的老人。",
      conditions: ["通常需要老年人能力评估", "地区和服务目录以当地执行细则为准"],
      missingInfoHints: ["是否已完成能力评估", "是否属于政策覆盖对象", "当地是否开放申请入口"],
      materialsRequired: ["老人身份证", "能力评估材料", "社区或民政部门要求的申请表"],
      materialsOptional: ["低保证明", "残疾证", "监护关系证明"],
      applicationSteps: ["联系居住地社区或民政窗口", "确认是否需要先做能力评估", "准备申请材料", "按要求提交并等待审核"],
      officialSourceUrl: "https://mzt.hunan.gov.cn/",
      lastVerifiedAt: "2026-07-02",
      verificationLevel: "待核实",
      synonyms: ["长护险", "失能补贴", "护理补贴", "养老服务消费补贴"],
      tags: ["home_care", "ability_assessment", "care"],
      riskNotice: "本页面提供政策信息整理和初步匹配，不代表政府部门最终审核结果。"
    },
    {
      id: "hunan-age-friendly-home-modification",
      userTitle: "湖南困难老人家庭适老化改造申请方向",
      officialTitle: "特殊困难老年人家庭适老化改造相关政策",
      category: "home_modification",
      region: "hunan",
      regionLabel: "湖南省",
      status: "待核实",
      benefit: "可能支持扶手、防滑、夜间照明、门槛处理等居家适老化改造。",
      suitableFor: "困难老人家庭、行动变慢或居家环境风险明显的家庭。",
      conditions: ["通常面向特殊困难老年人家庭", "改造范围以当地目录为准"],
      missingInfoHints: ["家庭经济身份是否符合", "当地是否仍在申报期", "改造项目是否在目录内"],
      materialsRequired: ["老人身份证", "户口簿", "家庭情况说明", "社区要求的申请表"],
      materialsOptional: ["低保证明", "残疾证", "房屋或居住情况材料"],
      applicationSteps: ["向居住地社区咨询申报期", "确认改造对象和目录", "准备材料并提交申请", "等待评估、施工或补贴确认"],
      officialSourceUrl: "https://mzt.hunan.gov.cn/",
      lastVerifiedAt: "2026-07-02",
      verificationLevel: "待核实",
      synonyms: ["适老化改造", "老人房改造", "扶手补贴", "防滑补贴"],
      tags: ["home_modification", "fall_risk", "low_income"],
      riskNotice: "本页面提供政策信息整理和初步匹配，不代表政府部门最终审核结果。"
    },
    {
      id: "national-elderly-tax-deduction",
      userTitle: "赡养老人专项附加扣除",
      officialTitle: "个人所得税专项附加扣除暂行办法相关规定",
      category: "caregiver",
      region: "national",
      regionLabel: "全国通用",
      status: "部分核实",
      benefit: "符合条件的纳税人可按规定享受赡养老人专项附加扣除。",
      suitableFor: "正在承担赡养责任、需要报税扣除的成年子女。",
      conditions: ["被赡养人年龄和亲属关系符合税务规定", "按税务系统要求填报"],
      missingInfoHints: ["家庭成员分摊方式", "是否已在个税 App 填报"],
      materialsRequired: ["被赡养人信息", "纳税人本人信息"],
      materialsOptional: ["约定分摊或指定分摊材料"],
      applicationSteps: ["打开个人所得税 App", "进入专项附加扣除填报", "选择赡养老人", "按家庭情况填报并保存"],
      officialSourceUrl: "https://www.chinatax.gov.cn/",
      lastVerifiedAt: "2026-07-02",
      verificationLevel: "部分核实",
      synonyms: ["赡养老人扣除", "个税扣除", "专项附加扣除"],
      tags: ["caregiver", "tax", "national"],
      riskNotice: "本页面提供政策信息整理和初步匹配，不代表税务机关最终审核结果。"
    },
    {
      id: "national-elderly-health-management",
      userTitle: "老年人健康管理服务",
      officialTitle: "国家基本公共卫生服务项目相关老年人健康管理服务",
      category: "medical",
      region: "national",
      regionLabel: "全国通用",
      status: "部分核实",
      benefit: "符合条件的老年人可向基层医疗卫生机构咨询年度健康管理服务。",
      suitableFor: "65 岁及以上老人，尤其是需要慢病随访和健康档案管理的人群。",
      conditions: ["年龄通常需达到 65 岁", "服务内容以当地基层医疗机构安排为准"],
      missingInfoHints: ["是否已建立居民健康档案", "常去的社区卫生服务中心或乡镇卫生院"],
      materialsRequired: ["老人身份证", "医保卡或社保卡"],
      materialsOptional: ["既往体检记录", "慢病用药清单"],
      applicationSteps: ["联系社区卫生服务中心或乡镇卫生院", "确认健康档案和年度服务安排", "预约体检或随访", "保存检查和随访记录"],
      officialSourceUrl: "https://www.nhc.gov.cn/",
      lastVerifiedAt: "2026-07-02",
      verificationLevel: "部分核实",
      synonyms: ["老年体检", "健康管理", "家庭医生"],
      tags: ["medical", "health", "national"],
      riskNotice: "本页面只做公共服务信息整理，不构成医疗诊断。"
    },
    {
      id: "hunan-ability-assessment",
      userTitle: "老年人能力评估申请方向",
      officialTitle: "老年人能力评估相关政策",
      category: "home_care",
      region: "hunan",
      regionLabel: "湖南省",
      status: "待核实",
      benefit: "评估结果可能影响护理补贴、养老服务补贴和照护服务申请。",
      suitableFor: "洗澡、穿衣、如厕、室内走动经常需要帮助的老人。",
      conditions: ["需要按当地流程预约或申请评估", "评估等级以专业机构结论为准"],
      missingInfoHints: ["当地评估入口", "是否已有评估报告"],
      materialsRequired: ["老人身份证", "基本健康情况说明", "社区要求的申请表"],
      materialsOptional: ["病历摘要", "残疾证", "照护情况说明"],
      applicationSteps: ["向居住地社区咨询评估入口", "提交评估申请", "配合入户或机构评估", "保存评估结果并用于后续政策申请"],
      officialSourceUrl: "https://mzt.hunan.gov.cn/",
      lastVerifiedAt: "2026-07-02",
      verificationLevel: "待核实",
      synonyms: ["能力评估", "失能评估", "照护等级评估"],
      tags: ["home_care", "ability_assessment", "prerequisite"],
      riskNotice: "本页面不提供正式失能等级认定，评估结果以当地指定流程为准。"
    },
    {
      id: "yueyang-community-elderly-meal",
      userTitle: "岳阳社区老年助餐服务咨询方向",
      officialTitle: "社区老年助餐服务相关政策",
      category: "community",
      region: "yueyang",
      regionLabel: "湖南省 岳阳市",
      status: "待核实",
      benefit: "部分社区可能提供老年助餐、优惠餐或送餐服务。",
      suitableFor: "独居、白天独处、做饭不方便或子女异地的老人。",
      conditions: ["服务覆盖社区和收费标准以当地为准", "补贴对象以当地执行细则为准"],
      missingInfoHints: ["居住地社区是否有助餐点", "是否支持送餐", "是否有补贴或优惠"],
      materialsRequired: ["老人身份证", "社区登记信息"],
      materialsOptional: ["低保证明", "残疾证"],
      applicationSteps: ["联系居住地社区", "确认附近助餐点或送餐范围", "登记老人信息", "确认收费、补贴和用餐方式"],
      officialSourceUrl: "https://www.yueyang.gov.cn/",
      lastVerifiedAt: "2026-07-02",
      verificationLevel: "待核实",
      synonyms: ["老人吃饭补贴", "助餐补贴", "老年食堂"],
      tags: ["community", "living_alone", "meal"],
      riskNotice: "本页面提供服务方向整理，不代表所在社区一定开通服务。"
    },
    {
      id: "national-cross-province-medical-filing",
      userTitle: "异地就医备案办理方向",
      officialTitle: "跨省异地就医直接结算备案相关政策",
      category: "medical",
      region: "national",
      regionLabel: "全国通用",
      status: "部分核实",
      benefit: "符合条件后，异地就医可能可按规定直接结算。",
      suitableFor: "长期在外地居住、随子女生活或需要跨地区看病的老人。",
      conditions: ["参保地政策和备案类型需确认", "就医地医院是否联网结算需确认"],
      missingInfoHints: ["医保参保地", "长期居住地", "目标医院是否支持结算"],
      materialsRequired: ["老人身份证", "医保电子凭证或社保卡"],
      materialsOptional: ["异地居住材料", "转诊转院材料"],
      applicationSteps: ["确认医保参保地", "通过国家医保服务平台或参保地渠道备案", "选择备案类型和就医地", "就医前确认医院是否支持直接结算"],
      officialSourceUrl: "https://www.nhsa.gov.cn/",
      lastVerifiedAt: "2026-07-02",
      verificationLevel: "部分核实",
      synonyms: ["异地医保", "异地报销", "跨省就医"],
      tags: ["medical", "insurance", "national"],
      riskNotice: "本页面提供备案方向整理，具体待遇和结算结果以医保部门规定为准。"
    }
  ];

  function regionMatches(policy, region) {
    if (!region || region === "unknown" || region === "all") return true;
    if (policy.region === "national") return true;
    if (region === "xiangyin") return ["xiangyin", "yueyang", "hunan"].includes(policy.region);
    if (region === "yueyang") return ["yueyang", "hunan"].includes(policy.region);
    if (region === "hunan") return policy.region === "hunan";
    return policy.region === region;
  }

  function filterPolicies(filters) {
    const category = filters && filters.category;
    const region = filters && filters.region;
    const query = String((filters && filters.query) || "").trim().toLowerCase();

    return policies.filter((policy) => {
      if (category && category !== "all" && policy.category !== category) return false;
      if (region && region !== "all" && !regionMatches(policy, region)) return false;
      if (!query) return true;
      const haystack = [
        policy.userTitle,
        policy.officialTitle,
        policy.benefit,
        policy.suitableFor,
        policy.regionLabel,
        ...policy.synonyms
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  function getPolicyById(id) {
    return policies.find((policy) => policy.id === id) || null;
  }

  return {
    categories,
    policies,
    filterPolicies,
    getPolicyById
  };
});
