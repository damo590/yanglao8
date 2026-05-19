(function (global) {
  const categoryMeta = {
    fall_history: {
      name: "过去跌倒史",
      resultName: "既往跌倒风险",
      description: "过去跌倒或差点摔倒，是判断未来跌倒风险的重要信号。",
      defaultActions: [
        "问清楚过去一年有没有跌倒或差点摔倒",
        "记录跌倒发生的地点、时间和原因",
        "如果已经反复跌倒，建议做更完整的风险排查"
      ]
    },
    night: {
      name: "夜间起身",
      resultName: "夜间起身风险",
      description: "夜里起身、摸黑去厕所，是很多家庭容易忽略的高频风险场景。",
      defaultActions: [
        "放置床边小夜灯或感应灯",
        "清理床到厕所路线上的杂物、电线、地垫",
        "提醒老人起床后先坐一会儿再站"
      ]
    },
    bathroom: {
      name: "浴室厕所",
      resultName: "浴室厕所风险",
      description: "浴室湿滑、马桶起身困难、缺少扶手，都是高危场景。",
      defaultActions: [
        "处理浴室防滑和积水问题",
        "检查马桶旁是否有稳定支撑",
        "把毛巾、沐浴露、衣服放到顺手位置"
      ]
    },
    shoes: {
      name: "鞋子衣物",
      resultName: "鞋子衣物风险",
      description: "拖鞋打滑、裤脚拖地、站着换鞋，都是低成本但高频的风险点。",
      defaultActions: [
        "检查常穿拖鞋鞋底是否磨平",
        "换成防滑、包跟、合脚的室内鞋",
        "门口放一个稳定换鞋凳"
      ]
    },
    medicine: {
      name: "药物头晕",
      resultName: "用药头晕风险",
      description: "多重用药、安眠药、降压药后头晕，都可能增加跌倒风险。",
      defaultActions: [
        "整理一份老人常用药清单",
        "记录头晕、犯困、走路发飘发生的时间",
        "带药单咨询医生或药师，不要自行停药"
      ]
    },
    stairs: {
      name: "楼梯门槛",
      resultName: "楼梯门槛风险",
      description: "门槛、高低差、台阶、楼梯扶手和照明，都会影响行走安全。",
      defaultActions: [
        "检查门槛、高低差和台阶边缘",
        "增加夜间照明",
        "检查扶手是否连续、牢固、好抓"
      ]
    },
    body: {
      name: "身体功能",
      resultName: "身体功能风险",
      description: "走路变慢、起身困难、扶墙走、看不清台阶，可能提示身体功能下降。",
      defaultActions: [
        "观察老人起身、走路、上下楼是否变慢变费力",
        "关注肌力、平衡、营养和视力",
        "必要时咨询医生或康复专业人员"
      ]
    },
    communication: {
      name: "家属沟通",
      resultName: "家属执行风险",
      description: "很多家庭不是不知道风险，而是不了解现场、不知道怎么和老人沟通。",
      defaultActions: [
        "让老人或家人拍 4 张照片：床边、厕所、浴室、门口",
        "从老人容易接受的小改动开始",
        "把结果发给家人一起讨论，而不是只靠一个人推动"
      ]
    }
  };

  const questions = [
    { id: "q01", module: "过去跌倒史", category: "fall_history", text: "过去 12 个月，老人有没有跌倒过？", modes: ["weekly", "standard", "full"], options: [{ label: "没有", score: 0 }, { label: "有过 1 次，但没有受伤", score: 2, tags: ["已有跌倒史"], actions: ["建议优先做一次完整的家庭防摔排查"] }, { label: "有过 2 次或以上，或者有明显受伤", score: 4, redFlag: true, tags: ["反复跌倒", "高风险"], actions: ["建议尽快做完整风险评估，并关注身体、用药和居家环境因素"] }, { label: "不清楚，没问过", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议先问清楚过去一年是否有跌倒或差点摔倒"] }] },
    { id: "q02", module: "过去跌倒史", category: "fall_history", text: "过去 12 个月，老人有没有“差点摔倒”的情况？比如脚下一滑、绊了一下、扶住墙或家具才站稳。", modes: ["standard", "full"], options: [{ label: "没有", score: 0 }, { label: "偶尔有过", score: 1, tags: ["近跌倒"], actions: ["记录发生场景，优先排查地面、鞋子和夜间动线"] }, { label: "经常发生", score: 3, redFlag: true, tags: ["频繁近跌倒"], actions: ["建议重点关注平衡能力、下肢力量和家中绊倒点"] }, { label: "不清楚，没观察过", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议询问老人最近有没有扶墙、打滑、绊脚的情况"] }] },
    { id: "q03", module: "过去跌倒史", category: "fall_history", text: "老人跌倒或差点摔倒后，是否需要别人扶才能站起来？", modes: ["standard", "full"], options: [{ label: "不需要，可以自己站起来", score: 0 }, { label: "偶尔需要扶一下", score: 1, tags: ["起身能力下降"], actions: ["关注椅子、床边、马桶起身是否困难"] }, { label: "经常需要别人帮忙，或者起身很困难", score: 3, redFlag: true, tags: ["起身困难"], actions: ["建议关注下肢力量、平衡能力和必要支撑设施"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议观察老人从椅子、马桶、床边起身是否费力"] }] },
    { id: "q04", module: "过去跌倒史", category: "fall_history", text: "最近一年，老人有没有因为跌倒去医院、拍片、缝针、处理伤口？", modes: ["standard", "full"], options: [{ label: "没有", score: 0 }, { label: "有过轻微处理", score: 2, tags: ["跌倒后果"], actions: ["建议复盘跌倒地点、时间和原因"] }, { label: "有过去医院、拍片、骨折、头部撞伤等情况", score: 4, redFlag: true, tags: ["严重跌倒后果"], actions: ["建议做更完整的医疗和居家安全评估"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议确认过去一年是否因跌倒就医"] }] },
    { id: "q05", module: "过去跌倒史", category: "fall_history", text: "跌倒或差点摔倒前，老人有没有出现眼前发黑、头晕、短暂失去意识？", modes: ["standard", "full"], options: [{ label: "没有", score: 0 }, { label: "偶尔说过头晕", score: 2, tags: ["头晕"], actions: ["建议记录发生时间，特别是起身、洗澡、吃药后"] }, { label: "有眼前发黑、晕厥、站不稳、突然无力", score: 4, redFlag: true, tags: ["医疗红旗"], actions: ["不建议只做家居改造，应咨询医生或药师"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议询问老人是否有起身头晕、眼前发黑"] }] },
    { id: "q06", module: "夜间起身风险", category: "night", text: "老人夜里从床边走到厕所，中间是否需要摸黑走一段路？", modes: ["weekly", "standard", "full"], options: [{ label: "不需要，路上有灯", score: 0 }, { label: "偶尔会摸黑走", score: 1, tags: ["夜间照明不足"], actions: ["可以先放床边小夜灯或感应灯"] }, { label: "经常摸黑走", score: 3, tags: ["夜间动线高风险"], actions: ["优先安装床边、走廊、厕所门口感应灯"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议让家人晚上实际走一遍床到厕所的路线"] }] },
    { id: "q07", module: "夜间起身风险", category: "night", text: "老人躺在床上时，是否能方便打开灯？", modes: ["standard", "full"], options: [{ label: "能，床边伸手就能开灯", score: 0 }, { label: "有灯，但不太方便", score: 1, tags: ["床边照明不便"], actions: ["考虑床头遥控灯、小夜灯或感应灯"] }, { label: "需要下床后才能开灯，或者只能摸黑", score: 3, tags: ["床边照明高风险"], actions: ["优先改床边照明，避免下床后才找开关"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议拍一张床边和开关位置照片"] }] },
    { id: "q08", module: "夜间起身风险", category: "night", text: "床到厕所这条路上，有没有椅子、杂物、电线、地垫、纸箱挡路？", modes: ["standard", "full"], options: [{ label: "没有，路比较空", score: 0 }, { label: "有一点，但不明显", score: 1, tags: ["轻度绊倒风险"], actions: ["清理夜间动线上的临时杂物"] }, { label: "经常需要绕开东西", score: 3, tags: ["绊倒高风险"], actions: ["优先清掉床到厕所路线上的杂物、电线、地垫"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议让老人或家人拍床到厕所路线照片"] }] },
    { id: "q09", module: "夜间起身风险", category: "night", text: "老人夜里起床时，是否会先坐一会儿再站起来？", modes: ["standard", "full"], options: [{ label: "会，起身比较慢", score: 0 }, { label: "偶尔会", score: 1, tags: ["起身习惯待改善"], actions: ["提醒起床后先坐 30 秒再站"] }, { label: "经常一下子起身，或者起身后头晕", score: 3, tags: ["起身头晕风险"], actions: ["提醒先坐后站，并关注血压、用药和夜间如厕"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议询问老人夜里起身是否头晕"] }] },
    { id: "q10", module: "夜间起身风险", category: "night", text: "老人夜里是否经常急着去厕所？", modes: ["full"], options: [{ label: "很少", score: 0 }, { label: "偶尔", score: 1, tags: ["夜间如厕"], actions: ["保持床到厕所路线清爽明亮"] }, { label: "经常很急，来不及慢慢走", score: 3, tags: ["急迫如厕风险"], actions: ["优先改善夜间灯光和动线，必要时咨询医生了解夜尿原因"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议询问老人夜里起夜次数和是否着急"] }] },
    { id: "q11", module: "浴室厕所风险", category: "bathroom", text: "老人洗澡后，浴室地面是否容易积水或打滑？", modes: ["weekly", "standard", "full"], options: [{ label: "不会，地面干燥防滑", score: 0 }, { label: "偶尔有水，但会及时处理", score: 1, tags: ["浴室轻度湿滑"], actions: ["准备刮水器、防滑垫，洗澡后及时处理积水"] }, { label: "经常湿滑", score: 3, tags: ["浴室高风险"], actions: ["优先处理浴室防滑、干湿分离和排水"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议拍浴室地面和洗澡后积水情况"] }] },
    { id: "q12", module: "浴室厕所风险", category: "bathroom", text: "浴室或马桶旁，有没有老人能抓稳的扶手？", modes: ["standard", "full"], options: [{ label: "有，而且牢固", score: 0 }, { label: "有类似支撑物，但不确定牢不牢", score: 1, tags: ["支撑点不确定"], actions: ["检查支撑物是否真的牢固，避免扶门、扶洗手台代替扶手"] }, { label: "没有，只能扶墙、扶门、扶洗手台", score: 3, tags: ["缺少稳定支撑"], actions: ["优先考虑马桶旁和淋浴区扶手"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议拍马桶旁、淋浴区和洗手台周围照片"] }] },
    { id: "q13", module: "浴室厕所风险", category: "bathroom", text: "老人从马桶站起来时，是否需要扶墙、扶门、扶洗手台？", modes: ["standard", "full"], options: [{ label: "不需要", score: 0 }, { label: "偶尔需要", score: 1, tags: ["马桶起身费力"], actions: ["观察是否需要马桶扶手或增高坐垫"] }, { label: "经常需要", score: 3, tags: ["厕所起身高风险"], actions: ["优先增加稳定扶手，避免扶门或洗手台"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议观察老人如厕后站起是否费力"] }] },
    { id: "q14", module: "浴室厕所风险", category: "bathroom", text: "老人洗澡时，是否需要弯腰、踮脚去拿毛巾、衣服、沐浴露？", modes: ["standard", "full"], options: [{ label: "不需要，东西都在顺手位置", score: 0 }, { label: "偶尔需要", score: 1, tags: ["洗澡动作风险"], actions: ["把常用物品放到腰到胸口高度"] }, { label: "经常需要弯腰或踮脚", score: 2, tags: ["洗澡动作高风险"], actions: ["重新摆放毛巾、衣服、沐浴露，避免弯腰踮脚"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议检查浴室置物架高度"] }] },
    { id: "q15", module: "浴室厕所风险", category: "bathroom", text: "浴室门口的地垫是否容易移动、卷边或吸水后打滑？", modes: ["full"], options: [{ label: "不会，地垫稳定防滑", score: 0 }, { label: "偶尔会动", score: 1, tags: ["地垫不稳定"], actions: ["检查地垫背面是否防滑"] }, { label: "经常移位或卷边", score: 3, tags: ["地垫绊倒风险"], actions: ["换成稳定防滑地垫，或移除不稳定地垫"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议拍浴室门口地垫照片"] }] },
    { id: "q16", module: "鞋子衣物风险", category: "shoes", text: "老人最常穿的拖鞋，鞋底是否磨平、变硬、遇水打滑？", modes: ["weekly", "standard", "full"], options: [{ label: "没有，鞋底防滑还可以", score: 0 }, { label: "有一点磨损", score: 1, tags: ["鞋底磨损"], actions: ["下次回家检查鞋底磨损情况"] }, { label: "明显磨平、发硬或打滑", score: 3, tags: ["鞋底高风险"], actions: ["优先换防滑、包跟、合脚的室内鞋"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议让老人拍最常穿拖鞋的鞋底照片"] }] },
    { id: "q17", module: "鞋子衣物风险", category: "shoes", text: "老人在家是否经常穿松垮拖鞋、踩着鞋后跟，或者只穿袜子走路？", modes: ["standard", "full"], options: [{ label: "很少", score: 0 }, { label: "偶尔", score: 1, tags: ["室内鞋习惯风险"], actions: ["提醒尽量穿合脚、防滑、有包裹性的鞋"] }, { label: "经常", score: 3, tags: ["室内鞋高风险"], actions: ["优先替换松垮拖鞋，避免只穿袜子走路"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议确认老人平时在家最常穿什么鞋"] }] },
    { id: "q18", module: "鞋子衣物风险", category: "shoes", text: "老人的裤脚、睡裤、裙摆是否容易拖地或绊脚？", modes: ["standard", "full"], options: [{ label: "不会", score: 0 }, { label: "偶尔会", score: 1, tags: ["衣物绊脚"], actions: ["检查睡裤、家居裤长度"] }, { label: "经常拖地或太宽松", score: 2, tags: ["衣物绊倒风险"], actions: ["更换合身裤子，避免裤脚拖地"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议观察老人常穿家居服是否拖地"] }] },
    { id: "q19", module: "鞋子衣物风险", category: "shoes", text: "家门口有没有稳定的换鞋凳？", modes: ["full"], options: [{ label: "有，老人能坐着换鞋", score: 0 }, { label: "有椅子，但不太稳定", score: 1, tags: ["换鞋支撑不足"], actions: ["换成稳定、不晃动的换鞋凳"] }, { label: "没有，老人经常站着换鞋", score: 2, tags: ["单脚站立风险"], actions: ["门口放稳定换鞋凳，避免单脚站着换鞋"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议拍门口换鞋区域照片"] }] },
    { id: "q20", module: "鞋子衣物风险", category: "shoes", text: "如果老人使用手杖或助行器，起身时是否经常拿不到？", modes: ["full"], options: [{ label: "不使用辅具", score: 0 }, { label: "使用，但通常放在顺手位置", score: 0 }, { label: "使用，但经常放太远", score: 2, tags: ["辅具可及性风险"], actions: ["固定手杖或助行器放置点，床边、沙发边、厕所门口都要能拿到"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议确认老人是否使用手杖或助行器"] }] },
    { id: "q21", module: "药物头晕风险", category: "medicine", text: "老人每天是否长期服用多种药物？", modes: ["standard", "full"], options: [{ label: "没有，或药物很少", score: 0 }, { label: "大概 2～3 种", score: 1, tags: ["用药需关注"], actions: ["建议整理一份常用药清单"] }, { label: "4～5 种以上，或者经常换药", score: 3, tags: ["多重用药风险"], actions: ["不建议自行停药，可带药单咨询医生或药师"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议拍药盒或整理药单"] }] },
    { id: "q22", module: "药物头晕风险", category: "medicine", text: "老人是否服用安眠药、助眠药、镇静类或情绪相关药物？", modes: ["standard", "full"], options: [{ label: "没有", score: 0 }, { label: "偶尔服用", score: 1, tags: ["助眠药物"], actions: ["关注服药后夜间起身是否困倦或反应慢"] }, { label: "经常服用", score: 3, tags: ["夜间跌倒风险"], actions: ["重点关注夜间起身、头晕、反应变慢，不要自行停药"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议确认老人是否使用助眠或镇静类药物"] }] },
    { id: "q23", module: "药物头晕风险", category: "medicine", text: "老人吃降压药后，是否出现站起来头晕、眼前发黑？", modes: ["standard", "full"], options: [{ label: "没有", score: 0 }, { label: "偶尔", score: 2, tags: ["起立性头晕"], actions: ["记录头晕发生时间，和医生讨论血压与用药时间"] }, { label: "经常", score: 4, redFlag: true, tags: ["医疗红旗", "起身头晕"], actions: ["建议咨询医生或药师，不要自行停药"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议询问老人是否有起身眼前发黑"] }] },
    { id: "q24", module: "药物头晕风险", category: "medicine", text: "老人最近 1 个月有没有新加药、换药、加量后变困、变晕、走路发飘？", modes: ["standard", "full"], options: [{ label: "没有", score: 0 }, { label: "有一点，但不明显", score: 1, tags: ["换药观察期"], actions: ["记录变化开始时间，继续观察"] }, { label: "明显变困、变晕或走路不稳", score: 4, redFlag: true, tags: ["换药后高风险"], actions: ["建议带药单咨询医生或药师"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议确认最近是否换药、加药、加量"] }] },
    { id: "q25", module: "药物头晕风险", category: "medicine", text: "老人有没有低血糖样表现，比如出冷汗、手抖、突然无力、心慌？", modes: ["full"], options: [{ label: "没有", score: 0 }, { label: "偶尔", score: 2, tags: ["低血糖风险"], actions: ["如果有糖尿病或降糖药，建议记录发生时间"] }, { label: "经常", score: 4, redFlag: true, tags: ["医疗红旗", "突发无力"], actions: ["建议尽快咨询医生，不要只靠居家改造解决"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议询问老人是否有突然无力、手抖、出冷汗"] }] },
    { id: "q26", module: "楼梯门槛风险", category: "stairs", text: "老人上下楼梯时，是否必须扶墙、扶栏杆，或者明显比以前吃力？", modes: ["standard", "full"], options: [{ label: "不需要", score: 0 }, { label: "偶尔需要", score: 1, tags: ["楼梯能力下降"], actions: ["检查扶手、灯光、台阶边缘"] }, { label: "经常需要，或者不敢上下楼", score: 3, tags: ["楼梯高风险"], actions: ["优先检查扶手是否牢固、台阶是否防滑、灯光是否足够"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议观察老人上下楼是否费力"] }] },
    { id: "q27", module: "楼梯门槛风险", category: "stairs", text: "家里或门口是否有老人容易踢到的门槛、高低差、台阶？", modes: ["standard", "full"], options: [{ label: "没有", score: 0 }, { label: "有一点，但老人熟悉", score: 1, tags: ["高低差"], actions: ["给高低差位置增加醒目标识"] }, { label: "有明显高低差，老人容易踢到", score: 3, tags: ["门槛高风险"], actions: ["考虑斜坡过渡、醒目标识或减少门槛"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议拍门口、厕所、阳台、厨房门槛照片"] }] },
    { id: "q28", module: "楼梯门槛风险", category: "stairs", text: "楼梯、门口、厕所门口晚上是否光线不足？", modes: ["standard", "full"], options: [{ label: "不会，灯光足够", score: 0 }, { label: "偶尔偏暗", score: 1, tags: ["夜间照明不足"], actions: ["增加夜灯或感应灯"] }, { label: "经常偏暗，看不清地面", score: 3, tags: ["夜间高风险"], actions: ["优先增加楼梯、门口、厕所门口照明"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议晚上实际走一遍常用路线"] }] },
    { id: "q29", module: "楼梯门槛风险", category: "stairs", text: "楼梯扶手是否连续、牢固、好抓？", modes: ["full"], options: [{ label: "是，比较牢固", score: 0 }, { label: "有扶手，但不太好抓", score: 1, tags: ["扶手不便"], actions: ["检查扶手高度、粗细和连续性"] }, { label: "没有扶手，或扶手松动", score: 3, tags: ["扶手高风险"], actions: ["优先加固或安装连续扶手"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议检查楼梯扶手是否松动"] }] },
    { id: "q30", module: "楼梯门槛风险", category: "stairs", text: "阳台、厨房、厕所门口是否有湿滑地面或地砖反光看不清？", modes: ["full"], options: [{ label: "没有", score: 0 }, { label: "偶尔有", score: 1, tags: ["湿区风险"], actions: ["拖地后及时干燥，增加防滑措施"] }, { label: "经常有，特别是洗澡或拖地后", score: 3, tags: ["湿区高风险"], actions: ["优先处理防滑、吸水和高低差标识"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议拍厨房、阳台、厕所门口地面照片"] }] },
    { id: "q31", module: "身体功能风险", category: "body", text: "最近 6 个月，老人走路速度是否明显变慢？", modes: ["standard", "full"], options: [{ label: "没有", score: 0 }, { label: "有一点", score: 1, tags: ["行动变慢"], actions: ["关注日常活动量和下肢力量"] }, { label: "明显变慢，或者走一会儿就累", score: 3, tags: ["行动能力下降"], actions: ["建议关注肌力、平衡、营养和慢病管理"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议下次同行时观察走路速度"] }] },
    { id: "q32", module: "身体功能风险", category: "body", text: "老人从椅子站起来时，是否需要用手撑桌子、扶手或大腿？", modes: ["standard", "full"], options: [{ label: "不需要", score: 0 }, { label: "偶尔需要", score: 1, tags: ["下肢力量下降"], actions: ["关注常坐椅子的高度和稳定性"] }, { label: "经常需要", score: 3, tags: ["起身能力风险"], actions: ["优先检查椅子、马桶、床边是否有稳定支撑"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议观察老人从椅子起身是否费力"] }] },
    { id: "q33", module: "身体功能风险", category: "body", text: "老人是否经常扶墙、扶家具在家里走？", modes: ["standard", "full"], options: [{ label: "不会", score: 0 }, { label: "偶尔", score: 1, tags: ["轻度平衡风险"], actions: ["观察是否只在特定位置扶墙"] }, { label: "经常", score: 3, tags: ["平衡高风险"], actions: ["说明平衡或力量可能下降，也说明家里缺少稳定支撑"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议询问是否在家经常扶墙走"] }] },
    { id: "q34", module: "身体功能风险", category: "body", text: "老人看台阶、地面高低差、夜间地面时，是否容易看不清？", modes: ["standard", "full"], options: [{ label: "不会", score: 0 }, { label: "偶尔", score: 1, tags: ["视力或照明风险"], actions: ["检查灯光和地面高低差标识"] }, { label: "经常", score: 3, tags: ["视觉相关跌倒风险"], actions: ["关注眼镜、灯光、台阶边缘和地面反差"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议观察老人上下台阶和夜间行走情况"] }] },
    { id: "q35", module: "身体功能风险", category: "body", text: "最近半年，老人是否明显变瘦、没力气、活动减少？", modes: ["full"], options: [{ label: "没有", score: 0 }, { label: "有一点", score: 1, tags: ["虚弱倾向"], actions: ["关注饮食、活动量和精神状态"] }, { label: "明显变瘦、变虚弱或不爱动", score: 3, tags: ["虚弱风险"], actions: ["不只做环境整改，也要关注营养、肌力和慢病管理"] }, { label: "不清楚", score: 1, infoGap: true, tags: ["信息缺口"], actions: ["建议询问近期体重、食欲和活动变化"] }] },
    { id: "q36", module: "家属沟通与执行", category: "communication", text: "你和老人是否同住，能不能经常看到家里的真实环境？", modes: ["weekly", "standard", "full"], options: [{ label: "同住，基本了解", score: 0 }, { label: "不同住，但经常回去", score: 1, tags: ["轻度信息缺口"], actions: ["下次回家重点看床边、浴室、厕所、门口"] }, { label: "很少回去，主要靠电话了解", score: 2, infoGap: true, tags: ["信息缺口"], actions: ["建议让老人拍 4 张照片：床边、厕所、浴室、门口"] }, { label: "不清楚家里现在什么样", score: 3, infoGap: true, tags: ["严重信息缺口"], actions: ["先别急着买东西，优先确认真实环境"] }] },
    { id: "q37", module: "家属沟通与执行", category: "communication", text: "你提醒老人防摔时，老人通常是什么反应？", modes: ["standard", "full"], options: [{ label: "愿意配合", score: 0 }, { label: "口头答应，但不一定改", score: 1, tags: ["执行不稳定"], actions: ["把整改动作拆成很小的一步"] }, { label: "明显抗拒，觉得自己没问题", score: 2, tags: ["沟通阻力"], actions: ["不要说“你不行”，改成“我担心晚上地滑，先试一个小夜灯”"] }, { label: "还没认真聊过", score: 1, infoGap: true, tags: ["沟通未开始"], actions: ["先从不冒犯的小改动开始，比如小夜灯、防滑鞋"] }] },
    { id: "q38", module: "家属沟通与执行", category: "communication", text: "如果只能先改一件事，老人最可能接受哪类？", modes: ["standard", "full"], options: [{ label: "不花钱的整理清理", score: 0, actions: ["先清理夜间动线和门口杂物"] }, { label: "小东西，比如夜灯、防滑鞋、防滑垫", score: 0, actions: ["先从低成本、低打扰的小物件开始"] }, { label: "安装类，比如扶手、马桶辅助", score: 1, actions: ["适合已有明显起身困难或浴室风险的家庭"] }, { label: "不确定，老人可能都不接受", score: 2, tags: ["执行阻力"], actions: ["先用照片和具体场景沟通，不要一上来讲大道理"] }] },
    { id: "q39", module: "家属沟通与执行", category: "communication", text: "你希望第一步整改预算控制在多少？", modes: ["full"], options: [{ label: "0 元，先整理和观察", score: 0, actions: ["优先清理杂物、固定电线、调整常用物品位置"] }, { label: "50 元以内", score: 0, actions: ["可优先考虑小夜灯、防滑贴、收纳整理"] }, { label: "300 元以内", score: 0, actions: ["可考虑防滑鞋、防滑垫、换鞋凳、感应灯组合"] }, { label: "可以接受更完整的适老化改造", score: 0, actions: ["可进一步评估扶手、马桶辅助、浴室防滑和动线改造"] }] },
    { id: "q40", module: "家属沟通与执行", category: "communication", text: "家里是否有人能一起推动防摔整改？", modes: ["full"], options: [{ label: "有，家人愿意一起做", score: 0 }, { label: "有人，但需要我提醒", score: 1, tags: ["协同一般"], actions: ["把结果页发给家人，先分工确认照片和环境"] }, { label: "基本只有我一个人负责", score: 2, tags: ["照护压力"], actions: ["优先选择今天能完成的小动作，不要一次改太多"] }, { label: "不确定", score: 1, infoGap: true, tags: ["协同不确定"], actions: ["先把最明显的 3 个风险发给家人讨论"] }] }
  ];

  function getQuestionsByMode(mode) {
    if (mode === "custom") return questions.slice();
    return questions.filter((question) => Array.isArray(question.modes) && question.modes.includes(mode));
  }

  const bank = {
    questions,
    categoryMeta,
    getQuestionsByMode
  };

  global.FallRiskQuestionBank = bank;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = bank;
  }
})(typeof window !== "undefined" ? window : globalThis);
