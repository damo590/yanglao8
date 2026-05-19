(function (global) {
  const TAGS = {
    prevention: "prevention",
    fallRisk: "fall_risk",
    livingAlone: "living_alone",
    mobility: "mobility",
    medication: "medication",
    medical: "medical",
    emergency: "emergency",
    caregiver: "caregiver",
    policy: "policy",
    institution: "institution",
    familyConflict: "family_conflict",
    actionList: "action_list"
  };

  function option(value, title, desc, tags, score) {
    return {
      id: value,
      value,
      label: title,
      title,
      desc,
      tags,
      score
    };
  }

  const questions = [
    {
      id: "living_status",
      title: "居住状态",
      hint: "先判断日常风险能不能被看见，以及谁能第一时间响应。",
      options: [
        option("with_children", "和子女同住", "信息更容易被看到，关键在于家人分工和长期执行不要停在口头关心。", ["prevention", "action_list"], 1),
        option("couple", "父母两人住", "能互相照应，但一方出状况时，另一方未必能独立处理。", ["emergency", "caregiver"], 2),
        option("alone_daytime", "独居或白天长期独处", "风险不在于没人关心，而在于出事后可能没人及时发现和到场。", ["living_alone", "emergency"], 4)
      ]
    },
    {
      id: "child_distance",
      title: "子女距离",
      hint: "距离决定你靠现场处理，还是要靠远程信息、联系人和服务节点协作。",
      options: [
        option("nearby", "同城，30分钟内能到", "适合做现场排查，把浴室、床边、用药和动线问题直接落地。", ["prevention", "action_list"], 1),
        option("same_city_busy", "同城但很难常回", "距离不远但时间不可控，小问题容易拖到变成大问题。", ["caregiver", "action_list"], 2),
        option("far", "异地或很少回家", "需要一套远程看见问题的办法：照片、报平安、联系人和服务入口。", ["living_alone", "emergency"], 4)
      ]
    },
    {
      id: "mobility",
      title: "行动和自理能力",
      hint: "重点看起身、转身、洗澡、夜里上厕所这些真实动作。",
      options: [
        option("steady", "自己行动基本稳定", "走路和起身还顺，适合提前做低成本预防。", ["prevention", "mobility"], 1),
        option("slower", "明显变慢，偶尔扶墙或扶家具", "肌力、平衡或光线判断可能已经影响日常动作。", ["mobility", "fall_risk"], 3),
        option("needs_support", "起身、洗澡或走路需要别人扶", "风险已经进入照护动作本身，不能只靠提醒小心。", ["mobility", "fall_risk", "caregiver"], 5)
      ]
    },
    {
      id: "fall_history",
      title: "最近一年是否摔倒",
      hint: "过去一年有没有跌倒，是判断防跌优先级的重要信号。",
      options: [
        option("no_fall", "没有摔倒", "没有跌倒不等于没有风险，可以先做预防清单。", ["prevention", "fall_risk"], 1),
        option("near_miss", "差点摔倒、打滑或绊过", "风险已经露头，只是还没有造成明显后果。", ["fall_risk", "action_list"], 3),
        option("fell_once", "摔倒过1次，但没有严重受伤", "需要复盘地点、时间、动作和环境，不要只说没事。", ["fall_risk", "mobility"], 4),
        option("injured_or_repeated", "摔倒2次以上，或摔后受伤/就医", "家庭优先级需要升级，先处理触发场景，再准备复诊沟通材料。", ["fall_risk", "mobility", "medical"], 5)
      ]
    },
    {
      id: "home_space",
      title: "家里最担心的空间",
      hint: "先选一个最可能出事的地方，行动清单会从这里开始。",
      options: [
        option("bathroom", "浴室/厕所", "湿滑、起身、转身、缺少扶手，风险集中且可改造。", ["fall_risk", "action_list"], 4),
        option("bedroom_night", "卧室到厕所的夜间动线", "夜里起身不完全清醒，光线和杂物会放大风险。", ["fall_risk", "emergency"], 3),
        option("door_stairs", "门口/楼梯/阳台", "门槛、台阶、高低差和晾晒动作会造成突然失衡。", ["fall_risk", "mobility"], 2),
        option("not_sure", "说不清哪里最危险", "不是没有风险，而是家里还没有形成风险地图。", ["prevention", "action_list"], 1)
      ]
    },
    {
      id: "chronic_meds",
      title: "慢病和长期用药",
      hint: "这里不做医疗判断，只看资料和用药协同是否会影响养老安排。",
      options: [
        option("few", "慢病少，长期药少", "医疗负担暂时不重，适合保持基础资料完整。", ["prevention", "medical"], 1),
        option("one_two", "有1-2种慢病或长期药", "复诊节奏、药单保存和家人同步开始变重要。", ["medical", "medication"], 2),
        option("many_meds", "多种慢病，或4种以上长期药", "资料、药单和近期变化需要更清楚，否则后续照护很难协同。", ["medical", "medication"], 5),
        option("unknown", "子女不清楚具体吃什么药", "最大问题是信息断层，真正需要处理的是先把药单看见。", ["medication", "medical", "action_list"], 4)
      ]
    },
    {
      id: "medical_records",
      title: "就医资料整理情况",
      hint: "资料是否清楚，会影响陪诊、复诊、服务申请和家庭沟通。",
      options: [
        option("ready", "病历、检查、药单基本清楚", "资料基础不错，重点是定期更新，不让信息过期。", ["prevention", "medical"], 1),
        option("scattered", "资料分散在纸袋、手机和不同家人手里", "不是没有信息，而是关键时刻找不到、对不上。", ["medical", "action_list"], 3),
        option("missing", "很多情况问不清、资料也缺", "会让陪诊、复诊沟通和服务申请都变难。", ["medical", "medication"], 5)
      ]
    },
    {
      id: "emergency_response",
      title: "突发响应机制",
      hint: "看出事后谁能发现、谁能联系、谁能到现场。",
      options: [
        option("clear", "紧急联系人和处理顺序清楚", "已有基本响应链，接下来要让信息在现场可见。", ["prevention", "emergency"], 1),
        option("partial", "知道找谁，但没有固定顺序", "大家都以为有人会管，突发时可能互相等待。", ["emergency", "family_conflict"], 3),
        option("none", "没有固定机制，主要靠临时联系", "临时联系最怕没人接、没人能到现场、没人知道下一步。", ["emergency", "living_alone"], 5)
      ]
    },
    {
      id: "family_care",
      title: "家庭照护分工",
      hint: "养老问题常常不是没人关心，而是没人把责任接住。",
      options: [
        option("clear", "家人分工基本清楚", "有人管安全、有人管就医、有人管日常联系，适合稳定复盘。", ["prevention", "action_list"], 1),
        option("one_person", "主要压在一个人身上", "长期容易透支，需要尽快拆出一部分任务。", ["caregiver", "action_list"], 4),
        option("unclear", "大家都关心，但没人固定负责", "事情会反复问、反复拖，真正的问题没人推进。", ["caregiver", "family_conflict"], 3),
        option("conflict", "家人意见分歧明显", "分歧通常来自事实、预算、距离和父母意愿不一致。", ["family_conflict", "institution", "caregiver"], 5)
      ]
    },
    {
      id: "policy_service",
      title: "政策和社区服务了解",
      hint: "先看是否知道街道、社区、长护险、适老化改造等入口。",
      options: [
        option("clear", "大致知道能找谁咨询", "已有入口，后面可以按父母实际情况筛选。", ["prevention", "policy"], 1),
        option("heard_unclear", "听过一些，但不知道怎么申请", "信息有碎片，缺少城市、街道和材料清单。", ["policy", "action_list"], 3),
        option("not_checked", "基本没查过", "可能错过低成本资源，也容易被不合适的商业服务带偏。", ["policy", "caregiver"], 4)
      ]
    },
    {
      id: "help_acceptance",
      title: "父母对外部帮助的接受度",
      hint: "护工、上门服务、社区服务和机构，都要看父母是否愿意接受。",
      options: [
        option("open", "愿意听听，也能商量", "沟通基础较好，可以先从低干扰服务开始。", ["prevention", "action_list"], 1),
        option("needs_discussion", "口头不反对，但需要慢慢谈", "适合先用事实和小服务试水，不要一次做大决定。", ["caregiver", "action_list"], 2),
        option("resistant", "明显排斥外人或服务介入", "照护方案不能只按子女想法推进，需要先处理沟通阻力。", ["family_conflict", "institution", "caregiver"], 4)
      ]
    },
    {
      id: "age_friendly_home",
      title: "家里适老化准备程度",
      hint: "看夜灯、防滑、扶手、动线、常用物品位置是否已经做过基础调整。",
      options: [
        option("basic_ready", "已经做过一些基础调整", "说明家里有预防意识，后续要按风险变化继续复盘。", ["prevention", "action_list"], 1),
        option("partial", "做过一点，但不系统", "可能改了看得见的地方，遗漏了夜间动线或浴室细节。", ["fall_risk", "action_list"], 3),
        option("not_ready", "基本没做过", "如果已经行动变慢或有跌倒史，就需要把空间调整排到前面。", ["fall_risk", "mobility"], 4)
      ]
    },
    {
      id: "budget_boundary",
      title: "费用和预算边界",
      hint: "不是让你马上花钱，而是先明确什么能承受、什么要分阶段做。",
      options: [
        option("clear", "家里大致有预算边界", "可以按优先级选择用品、服务或照护方案。", ["prevention", "action_list"], 1),
        option("rough", "只知道不能太贵，还没细算", "容易在急的时候乱买或被临时服务价格牵着走。", ["policy", "action_list"], 2),
        option("unclear", "家人对费用分担没谈清楚", "后续请护工、改造或看机构时，很容易变成家庭争论。", ["family_conflict", "institution"], 4)
      ]
    },
    {
      id: "info_sync",
      title: "信息同步方式",
      hint: "看父母情况、药单、复诊、风险点是否能被家人持续看见。",
      options: [
        option("weekly_sync", "有固定同步节奏", "适合继续用清单复盘，把问题逐步关闭。", ["prevention", "action_list"], 1),
        option("scattered_chat", "主要靠微信群零散沟通", "消息容易被刷掉，关键资料和决定很难追踪。", ["action_list", "caregiver"], 3),
        option("only_emergency", "只有出事才集中沟通", "平时看不见变化，等到集中沟通时往往已经比较被动。", ["emergency", "living_alone"], 4),
        option("argue_after_event", "一出事就争论谁没管好", "问题已经从信息同步变成家庭协同压力。", ["family_conflict", "caregiver"], 5)
      ]
    },
    {
      id: "current_anxiety",
      title: "当前最焦虑的问题",
      hint: "最后选一个你最想先解决的问题，用来校准行动优先级。",
      options: [
        option("prevention", "不知道先从哪开始", "信息很多但起点不清，最需要先排优先级。", ["prevention", "action_list"], 4),
        option("fall", "怕爸妈摔倒", "这类焦虑要落到具体空间、动作和用品，而不是反复提醒。", ["fall_risk", "mobility"], 5),
        option("alone", "父母独处时没人及时发现", "真正需要的是看见、确认和响应，而不只是叮嘱。", ["living_alone", "emergency"], 5),
        option("medical", "看病、复诊、用药太乱", "先把资料和药单理清楚，后续照护才有依据。", ["medical", "medication"], 5),
        option("policy", "不清楚能申请什么政策或服务", "下一步是做初筛，不是泛泛查资料。", ["policy", "action_list"], 4),
        option("institution", "纠结要不要看养老院或请护工", "先看照护缺口、费用边界和父母意愿，再比较方案。", ["institution", "caregiver", "family_conflict"], 5)
      ]
    }
  ];

  const enhancedQuestions = [
    {
      id: "cognitive_change",
      title: "记忆和判断变化",
      hint: "增强题只用于后续扩展，不进入当前15题标准流程。",
      options: [
        option("none", "没有明显变化", "日常沟通和判断基本稳定。", ["prevention"], 1),
        option("some", "偶尔忘事或反复问", "需要记录频率和触发场景，方便家庭沟通。", ["caregiver", "action_list"], 3),
        option("affects_life", "已经影响缴费、出门或用药", "要先补照护响应和资料同步，避免单点依赖。", ["emergency", "caregiver"], 5)
      ]
    },
    {
      id: "nutrition_sleep",
      title: "饮食和睡眠变化",
      hint: "增强题只做生活照护优先级参考。",
      options: [
        option("stable", "基本稳定", "先保持观察节奏。", ["prevention"], 1),
        option("changed", "食量、体重或睡眠有变化", "适合记录一周变化，再决定是否需要陪同咨询专业人员。", ["medical", "action_list"], 3),
        option("hard_to_manage", "明显影响体力或情绪", "家庭要先把记录、陪同和照护分工排出来。", ["caregiver", "medical"], 5)
      ]
    },
    {
      id: "service_trial",
      title: "是否尝试过外部服务",
      hint: "增强题用于后续服务推荐，不改变当前标准版入口。",
      options: [
        option("tried_good", "试过且体验还可以", "后续可以按稳定服务继续优化。", ["prevention", "policy"], 1),
        option("tried_bad", "试过但体验不好", "需要复盘问题出在服务类型、人员匹配还是预期不清。", ["caregiver", "policy"], 3),
        option("never", "没试过，不知道从哪开始", "适合先做低成本初筛，再小范围试用。", ["policy", "action_list"], 4)
      ]
    }
  ];

  const tagMeta = {
    prevention: {
      title: "提前准备",
      priority: "当前最重要的是先把养老准备做成基础清单，而不是等问题爆发后再临时处理。",
      action: "本周先整理一张家庭基础清单：常用药、紧急联系人、常去医院、家里最担心的3个位置。",
      direction: "后续方向：每月复盘一次家庭养老清单，先做低成本预防，再考虑服务或用品。"
    },
    fall_risk: {
      title: "防跌风险",
      priority: "防跌已经是当前优先事项，重点是锁定最容易跌倒的具体场景。",
      action: "先处理浴室或夜间动线：防滑垫、夜灯、清障、扶手或坐凳，选一个最高风险位置当天完成。",
      direction: "后续方向：进入家庭防摔专题，围绕浴室、床边、厕所、夜间动线做更细防跌排查。"
    },
    living_alone: {
      title: "独处看护",
      priority: "独居或长期独处的核心风险是出事后没人及时知道，需要补看见和确认机制。",
      action: "设定每天一次报平安规则，并写清楚超过多久没回复时由谁联系、谁能上门。",
      direction: "后续方向：重点看远程照护、邻里协作、社区巡访和紧急联系人机制。"
    },
    mobility: {
      title: "行动能力",
      priority: "行动和自理能力已经影响日常安全，需要看起身、洗澡、转身和走路支撑点。",
      action: "观察一次从床边起身到厕所的全过程，记录哪里需要扶、哪里光线暗、哪里容易卡住。",
      direction: "后续方向：考虑助行用品、浴室坐凳、扶手和必要的复诊沟通。"
    },
    medication: {
      title: "用药管理",
      priority: "长期用药信息需要变清晰，尤其是多药、换药、漏服和家人不了解的情况。",
      action: "把所有药盒摆出来拍照，记录药名、剂量、服用时间、开药医院和是否最近换药。",
      direction: "后续方向：下次复诊带药单，请医生或药师帮忙复核用药信息。"
    },
    medical: {
      title: "就医协同",
      priority: "就医资料和复诊信息需要先整理，否则防跌、照护和用药安排都会缺少依据。",
      action: "整理三类资料：病情记录、最近检查、常去医院和医生提醒，统一放到一个文件夹或相册。",
      direction: "后续方向：优先做就医资料卡、陪诊记录和复诊问题清单。"
    },
    emergency: {
      title: "突发响应",
      priority: "突发响应链还不够稳，关键是有顺序、有备选、有能到现场的人。",
      action: "写一张应急卡贴在家里：第一联系人、备选联系人、社区电话、常去医院、基础病和用药。",
      direction: "后续方向：建立家庭响应链，必要时接入社区、邻居或上门服务。"
    },
    caregiver: {
      title: "照护压力",
      priority: "照护压力已经出现，不能继续默认某一个人长期硬扛。",
      action: "把本周最耗人的一件事拆出来，明确交给另一个家人或外部服务承担。",
      direction: "后续方向：评估护工、上门服务、日间照料或短期托养。"
    },
    policy: {
      title: "政策服务",
      priority: "政策和社区服务信息需要初筛，避免错过低成本资源，也避免被不合适服务带偏。",
      action: "用父母所在城市和街道查一次：适老化改造、长护险、社区养老服务、助餐助浴入口。",
      direction: "后续方向：整理可申请资源和材料，优先看街道/社区入口。"
    },
    institution: {
      title: "机构选择",
      priority: "已经接近长期照护决策，不宜直接比较机构，先看照护缺口和父母意愿。",
      action: "写清楚家里缺口：白天没人看、洗澡困难、复诊困难、夜间风险或费用边界。",
      direction: "后续方向：比较居家服务、日间照料、护工和养老机构，不急着一步到位。"
    },
    family_conflict: {
      title: "家庭协同",
      priority: "家人之间需要统一事实、预算和分工，否则每个人都关心，最后没人真正跟进。",
      action: "开一次15分钟家庭小会，只定三件事：谁看药、谁看安全、谁联系社区或医院。",
      direction: "后续方向：建立家庭分工表和每周复盘节奏，减少重复争论。"
    },
    action_list: {
      title: "行动清单",
      priority: "当前需要把担心拆成可执行动作，避免一直查资料但没有推进。",
      action: "今天只选一件能完成的小事：拍4张环境照片、整理药单、确认联系人或查一个社区入口。",
      direction: "后续方向：把行动拆成今天、本周、本月三层，不一次性做大决定。"
    }
  };

  const typeRules = [
    { type: "提前准备型", tags: ["prevention", "action_list"] },
    { type: "防跌优先型", tags: ["fall_risk", "mobility"] },
    { type: "照护响应型", tags: ["living_alone", "emergency"] },
    { type: "就医用药协同型", tags: ["medical", "medication"] },
    { type: "长期照护决策型", tags: ["caregiver", "institution", "family_conflict"] }
  ];

  function createEmptyScores() {
    return Object.values(TAGS).reduce((scores, tag) => {
      scores[tag] = 0;
      return scores;
    }, {});
  }

  function findOption(question, value) {
    return question.options.find((item) => item.value === value || item.id === value);
  }

  function selectedOptions(answers) {
    return questions
      .map((question) => ({ question, option: findOption(question, answers && answers[question.id]) }))
      .filter((item) => item.option);
  }

  function scoreAnswers(answers) {
    const scores = createEmptyScores();
    selectedOptions(answers || {}).forEach(({ option }) => {
      (option.tags || []).forEach((tag) => {
        scores[tag] = (scores[tag] || 0) + Number(option.score || 0);
      });
    });
    return scores;
  }

  function topPriorityKeys(scores) {
    return Object.keys(scores)
      .map((tag) => ({ tag, score: scores[tag] || 0 }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag))
      .slice(0, 3)
      .map((item) => item.tag);
  }

  function profileType(scores) {
    const group = typeRules
      .map((rule) => ({
        type: rule.type,
        score: rule.tags.reduce((sum, tag) => sum + (scores[tag] || 0), 0)
      }))
      .sort((a, b) => b.score - a.score)[0];
    return group && group.score > 0 ? group.type : "提前准备型";
  }

  function uniq(items) {
    return [...new Set(items.filter(Boolean))];
  }

  function recommendedDirectionsFor(keys) {
    return uniq(keys.map((tag) => tagMeta[tag] && tagMeta[tag].direction)).slice(0, 3);
  }

  function buildParentProfileResult(answers) {
    const scores = scoreAnswers(answers || {});
    const topTags = topPriorityKeys(scores);
    const keys = topTags.length ? topTags : ["prevention", "action_list", "emergency"];
    return {
      type: profileType(scores),
      scores,
      totalScore: Object.values(scores).reduce((sum, score) => sum + score, 0),
      topTags: keys,
      priorities: uniq(keys.map((tag) => tagMeta[tag] && tagMeta[tag].priority)).slice(0, 3),
      weekActions: uniq(keys.map((tag) => tagMeta[tag] && tagMeta[tag].action)).slice(0, 3),
      recommendedDirections: recommendedDirectionsFor(keys)
    };
  }

  const api = {
    questions,
    enhancedQuestions,
    buildParentProfileResult,
    scoreAnswers
  };

  global.ParentProfileRuntime = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
