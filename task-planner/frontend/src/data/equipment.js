/**
 * 健身运动图鉴：健身器械 + 运动
 * 教学视频使用 B 站公开教程嵌入，仅作动作参考。
 * 图片 ?v= 用于强刷浏览器缓存。
 */

function bilibiliEmbed(bvid) {
  return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`;
}

const IMG_V = '20260715a';

function equipmentImage(file) {
  return `/equipment/${file}?v=${IMG_V}`;
}

/** @typedef {'equipment' | 'sport'} FitnessKind */

/**
 * @param {object} item
 * @returns {object}
 */
function withKind(item, kind) {
  return { ...item, kind };
}

const EQUIPMENT_CORE = [
  {
    id: 'bench-press-rack',
    name: '卧推架',
    englishName: 'Bench Press Rack',
    image: equipmentImage('bench-press-rack.png'),
    summary: '胸推核心自由重量器械，可做平板/上斜卧推，练胸、肩前束与肱三头。',
    muscles: ['胸大肌', '三角肌前束', '肱三头肌'],
    level: '入门～进阶',
    intro: [
      '卧推架通常由深蹲架/力量架配卧推凳组成，是健身房练胸的主力器械。',
      '相比固定器械，自由杠铃卧推能更好调动稳定肌，也更接近功能性推举力量。',
      '请务必设置安全杠或请人保护；新手可先用空杆或轻重量熟悉轨迹。',
    ],
    howTo: [
      '调节卧推凳高度，双眼大约位于杠铃正下方。',
      '双手略宽于肩，沉肩、收紧肩胛，双脚踩实地面。',
      '吸气下放至杠铃轻触胸中下部，呼气平稳推起，肘部不要过度打开。',
      '推至手臂接近伸直但不要猛锁死肘关节；力竭时用安全杠接住。',
    ],
    tips: [
      '米诺地尔涂药后 4 小时内避免大汗训练；晚间力量训练更合适。',
      '肩不适时可改为哑铃卧推或减少下放幅度。',
      '热身组必不可少，不要一上来就上大重量。',
    ],
    videos: [
      {
        title: '卧推保姆级教学',
        bvid: 'BV15c411s7Tp',
        embedUrl: bilibiliEmbed('BV15c411s7Tp'),
        pageUrl: 'https://www.bilibili.com/video/BV15c411s7Tp/',
      },
    ],
  },
  {
    id: 'smith-machine',
    name: '史密斯机',
    englishName: 'Smith Machine',
    image: equipmentImage('smith-machine.png'),
    summary: '固定轨道杠铃机，适合单人安全做深蹲、推举、弓步等，轨迹稳定。',
    muscles: ['股四头肌', '臀大肌', '胸/肩（推举变式）'],
    level: '入门友好',
    intro: [
      '史密斯机的杠铃沿固定导轨运动，左右不易失衡，适合新手建立动作模式。',
      '也可用于上斜卧推、肩推、弓步蹲等；因轨迹固定，不完全等同于自由重量。',
      '使用前确认安全挂钩位置，学会旋转杠铃解锁/上锁。',
    ],
    howTo: [
      '将安全销调到略低于动作最低点，防止力竭砸伤。',
      '站位使杠铃落在斜方上部（深蹲）或按目标动作调整。',
      '旋转解锁后控制下放，膝盖朝向脚尖，核心收紧。',
      '推起后旋转上锁，确认两侧都挂稳再离开。',
    ],
    tips: [
      '不要完全依赖轨道而放松核心；脚的位置会影响膝盖压力。',
      '若追求更自然的关节轨迹，可逐步过渡到深蹲架自由杠铃。',
    ],
    videos: [
      {
        title: '史密斯深蹲讲解（保姆级）',
        bvid: 'BV17N4y1e7Ge',
        embedUrl: bilibiliEmbed('BV17N4y1e7Ge'),
        pageUrl: 'https://www.bilibili.com/video/BV17N4y1e7Ge/',
      },
    ],
  },
  {
    id: 'hack-squat',
    name: '哈克深蹲',
    englishName: 'Hack Squat',
    image: equipmentImage('hack-squat.png'),
    summary: '靠背式腿举深蹲机，腰背压力较小，侧重股四头与臀部。',
    muscles: ['股四头肌', '臀大肌', '腘绳肌（辅助）'],
    level: '入门～中级',
    intro: [
      '哈克深蹲机让背部贴靠靠垫，肩部顶住垫块，沿斜轨下蹲上推。',
      '相比杠铃深蹲，脊柱负荷更低，适合练腿日加大股四头刺激。',
      '脚的前后左右站位会改变刺激侧重：靠前更偏臀腿后侧，靠后更偏股四头。',
    ],
    howTo: [
      '肩部卡入垫块，背部贴紧，双手握住把手。',
      '解锁安全钩后，屈膝下放至大腿接近平行或可控制的深度。',
      '膝盖与脚尖方向一致，不要内扣；呼气蹬起至接近伸直。',
      '组间把安全钩挂回，再调整重量。',
    ],
    tips: [
      '髋或膝不适时减小幅度与重量，优先动作质量。',
      '腰离开靠垫、臀部“翘出”是常见错误，保持贴靠。',
    ],
    videos: [
      {
        title: '哈克深蹲详解',
        bvid: 'BV18D421L7o7',
        embedUrl: bilibiliEmbed('BV18D421L7o7'),
        pageUrl: 'https://www.bilibili.com/video/BV18D421L7o7/',
      },
    ],
  },
  {
    id: 'squat-rack',
    name: '深蹲架',
    englishName: 'Squat Rack / Power Rack',
    image: equipmentImage('squat-rack.png'),
    summary: '自由重量深蹲与硬拉的基础架子，可调安全杠，适合进阶力量训练。',
    muscles: ['股四头肌', '臀大肌', '核心', '竖脊肌'],
    level: '中级（需保护意识）',
    intro: [
      '深蹲架（力量架）提供可调挂钩与安全杠，是杠铃深蹲、颈后深蹲、架上硬拉等动作的平台。',
      '自由重量对平衡与核心要求更高，训练效益也更大，但必须正确设置安全高度。',
      '无人保护时，务必把安全杠调到略低于最低点。',
    ],
    howTo: [
      '挂钩约在胸口高度，便于走出杠铃；安全杠调到深蹲最低点稍下。',
      '杠铃置于斜方肌上部，双手握杠，沉肩挺胸走出一步站稳。',
      '吸气下蹲，髋膝同步，膝不超脚尖方向；呼气蹬地站起。',
      '结束后稳稳放回挂钩，确认两侧都挂上。',
    ],
    tips: [
      '足弓塌陷、膝盖内扣时减重纠正。',
      '与卧推架可共用框架，注意训练后整理杠铃片。',
    ],
    videos: [
      {
        title: '深蹲保姆级教学',
        bvid: 'BV1KM4y117Yb',
        embedUrl: bilibiliEmbed('BV1KM4y117Yb'),
        pageUrl: 'https://www.bilibili.com/video/BV1KM4y117Yb/',
      },
    ],
  },
  {
    id: 'hip-abduction-adduction',
    name: '髋外展 / 腿内收',
    englishName: 'Hip Abduction & Adduction',
    image: equipmentImage('hip-abduction-adduction.png'),
    summary: '坐姿髋外展练侧臀（臀中小肌），腿内收练大腿内侧，常背靠背一体机。',
    muscles: ['臀中肌', '臀小肌', '大腿内收肌群'],
    level: '入门',
    intro: [
      '髋外展：双膝向外推开，强化侧臀与髋稳定，改善臀线与骨盆控制。',
      '腿内收：双膝向内夹紧，补足内收肌力量，有助于腿部力量平衡。',
      '两者肌群相反，同一台一体机通常旋转/切换垫块即可。',
    ],
    howTo: [
      '调整靠背与阻力臂，使膝关节垫舒适贴合。',
      '外展：躯干固定，呼气向外张开，吸气控制回位，避免借摆。',
      '内收：同样控制节奏，顶端稍停顿再缓慢打开。',
      '重量选择以能完成 12～15 次标准动作为宜。',
    ],
    tips: [
      '外展时不要耸肩塌腰；内收时不要用惯性甩腿。',
      '可作为练腿/练臀日的激活或收尾动作。',
    ],
    videos: [
      {
        title: '髋外展器械新手教程',
        bvid: 'BV1dg411Z73x',
        embedUrl: bilibiliEmbed('BV1dg411Z73x'),
        pageUrl: 'https://www.bilibili.com/video/BV1dg411Z73x/',
      },
      {
        title: '一分钟正确使用髋外展器械',
        bvid: 'BV1A741147qR',
        embedUrl: bilibiliEmbed('BV1A741147qR'),
        pageUrl: 'https://www.bilibili.com/video/BV1A741147qR/',
      },
    ],
  },
  {
    id: 'lat-pulldown-seated-row',
    name: '高位下拉 / 坐姿划船',
    englishName: 'Lat Pulldown & Seated Row',
    image: equipmentImage('lat-pulldown-seated-row.png'),
    summary: '一体式练背器械：垂直下拉练背宽，水平划船练背厚。',
    muscles: ['背阔肌', '菱形肌', '斜方肌中下部', '肱二头肌（辅助）'],
    level: '入门～中级',
    intro: [
      '高位下拉模拟引体向上轨迹，对新手更友好，重点拉宽背阔。',
      '坐姿划船走水平拉力线，强调肩胛后收，增加背部厚度。',
      '一台双工位器械可高效完成推拉平衡中的「拉」类训练。',
    ],
    howTo: [
      '高位下拉：大腿卡稳垫辊，宽握横杆，沉肩后把杆拉向锁骨上方，肘向下向后。',
      '不要用下背部猛晃借力；离心阶段控制还原。',
      '坐姿划船：双脚踩踏板，膝微屈，拉至腹部附近，肩胛骨主动后夹。',
      '还原时肩胛有控制地前伸，避免圆肩过度。',
    ],
    tips: [
      '拉到胸前时避免过度仰头或耸肩。',
      '握距、正反握可改变刺激侧重，循序渐进。',
    ],
    videos: [
      {
        title: '高位下拉（保姆级教程）',
        bvid: 'BV1oa4y1z73J',
        embedUrl: bilibiliEmbed('BV1oa4y1z73J'),
        pageUrl: 'https://www.bilibili.com/video/BV1oa4y1z73J/',
      },
      {
        title: '坐姿划船（超详细版）',
        bvid: 'BV1y14y1X7by',
        embedUrl: bilibiliEmbed('BV1y14y1X7by'),
        pageUrl: 'https://www.bilibili.com/video/BV1y14y1X7by/',
      },
    ],
  },
  {
    id: 'cable-crossover',
    name: '龙门架',
    englishName: 'Cable Crossover / Functional Trainer',
    image: equipmentImage('cable-crossover.png'),
    summary: '双侧可调滑轮绳索架，可做夹胸、面拉、弯举、踢腿等全身变式。',
    muscles: ['胸大肌', '三角肌', '背阔肌', '手臂与核心（多变式）'],
    level: '入门～进阶',
    intro: [
      '龙门架（绳索交叉训练器）两侧滑轮高度可调，是健身房最灵活的器械之一。',
      '经典动作包括绳索夹胸（飞鸟）、高位面拉、绳索划船、三头下压、踢腿后展等。',
      '阻力来自配重片，轨迹自由，适合雕刻细节与单侧纠正。',
    ],
    howTo: [
      '夹胸：两侧滑轮调至肩高或略上，向前站一步，肘微屈画弧线向中线合拢。',
      '面拉：滑轮高位，拉绳至面门两侧，外旋肩袖，改善圆肩体态。',
      '始终控制还原，不要让配重片猛撞。',
      '单侧动作时注意骨盆与躯干不要扭转代偿。',
    ],
    tips: [
      '重量过大易变成「甩绳」，优先泵感与控制。',
      '训练结束后把把手归位，滑轮高度恢复中位，方便下一位。',
    ],
    videos: [
      {
        title: '龙门架初级使用大全',
        bvid: 'BV1yK411G7WW',
        embedUrl: bilibiliEmbed('BV1yK411G7WW'),
        pageUrl: 'https://www.bilibili.com/video/BV1yK411G7WW/',
      },
      {
        title: '绳索飞鸟夹胸动作详解',
        bvid: 'BV13p411d74q',
        embedUrl: bilibiliEmbed('BV13p411d74q'),
        pageUrl: 'https://www.bilibili.com/video/BV13p411d74q/',
      },
    ],
  },
];

/** 新增常用器械 */
const EQUIPMENT_EXTRA = [
  {
    id: 'leg-press',
    name: '腿举机',
    englishName: 'Leg Press',
    image: equipmentImage('leg-press.png'),
    coverTone: 'leg',
    summary: '坐姿/斜卧推蹬器械，可安全上较大重量练股四头与臀腿。',
    muscles: ['股四头肌', '臀大肌', '腘绳肌'],
    level: '入门～进阶',
    intro: [
      '腿举机让你在靠背支撑下蹬起配重，比自由深蹲更容易加大负荷。',
      '脚的位置影响刺激：偏上更练臀与腘绳，偏下更练股四头。',
      '下放勿过深导致骨盆卷起或腰椎离开靠垫。',
    ],
    howTo: [
      '背部、臀部贴紧靠垫，双脚约与肩同宽踩在踏板上。',
      '解锁后屈膝下放，膝与脚尖方向一致，底部有控制。',
      '呼气蹬起至接近伸直，不要猛锁死膝盖。',
      '力竭时及时挂回安全销。',
    ],
    tips: [
      '腰离开靠垫时减幅度或减重。',
      '初学先熟悉全程再逐步加重。',
    ],
    videos: [
      {
        title: '腿举机标准动作讲解',
        bvid: 'BV1FJ411W7sL',
        embedUrl: bilibiliEmbed('BV1FJ411W7sL'),
        pageUrl: 'https://www.bilibili.com/video/BV1FJ411W7sL/',
      },
    ],
  },
  {
    id: 'pec-deck',
    name: '蝴蝶夹胸机',
    englishName: 'Pec Deck',
    image: equipmentImage('pec-deck.png'),
    coverTone: 'chest',
    summary: '固定轨迹夹胸，专注胸大肌内侧与中缝，入门友好。',
    muscles: ['胸大肌', '三角肌前束（辅助）'],
    level: '入门',
    intro: [
      '蝴蝶机（器械飞鸟）在坐姿下完成夹胸轨迹，稳定易学。',
      '适合胸部训练日的雕刻或力竭收尾。',
      '肘部保持微屈，避免关节过度伸直。',
    ],
    howTo: [
      '调节座椅使手柄约与胸口同高，背部贴靠。',
      '呼气向前向中线合拢，顶端稍停顿感受夹紧。',
      '吸气控制打开至肩部舒适幅度，不要过度拉伸。',
      '重量以能完成 10～15 次标准动作为宜。',
    ],
    tips: [
      '耸肩发力说明重量过大或沉肩不足。',
      '肩不适时可减小打开幅度。',
    ],
    videos: [
      {
        title: '蝴蝶机夹胸教程',
        bvid: 'BV1fx411N7Yw',
        embedUrl: bilibiliEmbed('BV1fx411N7Yw'),
        pageUrl: 'https://www.bilibili.com/video/BV1fx411N7Yw/',
      },
    ],
  },
  {
    id: 'shoulder-press-machine',
    name: '推肩机',
    englishName: 'Shoulder Press Machine',
    image: equipmentImage('shoulder-press-machine.png'),
    coverTone: 'shoulder',
    summary: '坐姿固定轨迹推举，练三角肌中束/前束，比杠铃推举更安全。',
    muscles: ['三角肌', '斜方肌上部', '肱三头肌（辅助）'],
    level: '入门～中级',
    intro: [
      '器械推肩降低失衡风险，适合单独强化肩部推力。',
      '座椅与靠背调到双手握把从耳旁起步较舒适。',
      '推起时不要过度挺腰借力。',
    ],
    howTo: [
      '背部贴靠，双脚踩实，核心收紧。',
      '呼气向上推至接近伸直，头顶上方略留余地。',
      '吸气缓慢下放至手肘约与肩平或略低。',
      '全程控制，顶端不要猛撞限位。',
    ],
    tips: [
      '肩峰撞击感时减小幅度或改哑铃推举。',
      '热身肩袖再上正式组。',
    ],
    videos: [
      {
        title: '器械推肩标准动作',
        bvid: 'BV1aW411Y7bK',
        embedUrl: bilibiliEmbed('BV1aW411Y7bK'),
        pageUrl: 'https://www.bilibili.com/video/BV1aW411Y7bK/',
      },
    ],
  },
  {
    id: 'leg-curl',
    name: '腿弯举机',
    englishName: 'Leg Curl',
    image: equipmentImage('leg-curl.png'),
    coverTone: 'ham',
    summary: '俯卧或坐姿屈膝拉起，孤立腘绳肌，平衡股四头训练。',
    muscles: ['腘绳肌', '小腿（辅助）'],
    level: '入门',
    intro: [
      '腿弯举专门刺激大腿后侧，对膝稳定性与体态均衡很重要。',
      '常见为俯卧、坐姿两种；臀部不要大幅度掀离垫面。',
      '可与腿举、深蹲组成完整腿日。',
    ],
    howTo: [
      '调节踝垫位置，使阻力落在脚踝上方舒适处。',
      '呼气屈膝拉起，顶端稍停；吸气控制下放。',
      '髋部贴实垫面，避免甩腿借力。',
      '建议中高次数（10～15）注重泵感。',
    ],
    tips: [
      '腘绳紧张时可先动态拉伸再加重。',
      '膝不适减重并缩减幅度。',
    ],
    videos: [
      {
        title: '腿弯举正确做法',
        bvid: 'BV1yt411c7kM',
        embedUrl: bilibiliEmbed('BV1yt411c7kM'),
        pageUrl: 'https://www.bilibili.com/video/BV1yt411c7kM/',
      },
    ],
  },
  {
    id: 'calf-raise-machine',
    name: '提踵机',
    englishName: 'Calf Raise Machine',
    image: equipmentImage('calf-raise-machine.png'),
    coverTone: 'calf',
    summary: '坐姿或站姿提踵，强化小腿腓肠肌与比目鱼肌。',
    muscles: ['腓肠肌', '比目鱼肌'],
    level: '入门',
    intro: [
      '提踵机可安全对小腿施加高次数刺激，改善跑跳与小腿线条。',
      '站姿更偏腓肠肌，坐姿屈膝更偏比目鱼肌。',
      '全程脚掌前部发力，脚跟有控制地下降。',
    ],
    howTo: [
      '肩膀或膝盖垫块贴合，脚掌前部踩稳踏板。',
      '呼气向上踮起至最高，短暂停顿。',
      '吸气缓慢下放至脚跟有拉伸感。',
      '15～20 次中高次数效果更好。',
    ],
    tips: [
      '不要用弹跳惯性；离心要慢。',
      '踝不稳时先空手靠墙练习。',
    ],
    videos: [
      {
        title: '小腿提踵训练讲解',
        bvid: 'BV1Hs411A7mY',
        embedUrl: bilibiliEmbed('BV1Hs411A7mY'),
        pageUrl: 'https://www.bilibili.com/video/BV1Hs411A7mY/',
      },
    ],
  },
  {
    id: 'assisted-pullup',
    name: '辅助引体向上机',
    englishName: 'Assisted Pull-up / Dip',
    image: equipmentImage('assisted-pullup.png'),
    coverTone: 'back',
    summary: '配重辅助完成引体或双杠臂屈伸，循序渐进建上肢拉力。',
    muscles: ['背阔肌', '肱二头肌', '胸大肌下沿（双杠）', '肱三头肌（双杠）'],
    level: '入门友好',
    intro: [
      '辅助机会用配重「抵消」部分体重，让尚做不了标准引体的人也能练满组。',
      '配重越大辅助越多；随能力提升逐步减少辅助。',
      '多数机型也可切换为双杠臂屈伸工位。',
    ],
    howTo: [
      '选择合适握距，双膝跪上辅助垫或双脚踩踏板。',
      '引体：沉肩后拉至下巴过杆，再控制下放。',
      '双杠：躯干略前倾练胸，直立更偏三头。',
      '避免猛晃借力，离心阶段 2～3 秒。',
    ],
    tips: [
      '能做 8～10 次标准后可减辅助重量。',
      '肩不适时改中立握或减少幅度。',
    ],
    videos: [
      {
        title: '辅助引体向上使用方法',
        bvid: 'BV1Rt411N7Vv',
        embedUrl: bilibiliEmbed('BV1Rt411N7Vv'),
        pageUrl: 'https://www.bilibili.com/video/BV1Rt411N7Vv/',
      },
    ],
  },
];

const SPORT_LIST_RAW = [
  {
    id: 'running',
    name: '跑步',
    englishName: 'Running',
    image: equipmentImage('running.png'),
    coverTone: 'run',
    summary: '有氧基础项目：燃脂、心肺、恢复日轻量有氧都适用；可户外或跑步机。',
    muscles: ['心肺', '下肢耐力', '核心稳定'],
    level: '入门～进阶',
    intro: [
      '跑步是最易落地的有氧方式，也可作为力量训练后的低强度收尾。',
      '新手建议先走跑结合，心率落在能说话但仍有呼吸节奏的区间。',
      '鞋与路面选择影响膝踝负担，不适立刻减量。',
    ],
    howTo: [
      '热身 5 分钟动态活动髋膝踝与轻度快走。',
      '躯干直立略前倾，步幅自然，落地轻柔靠近身体重心。',
      '按计划跑完既定时间或距离，再慢走放松 3～5 分钟。',
      '力量日后可改为 20～30 分钟轻松跑，避免影响恢复。',
    ],
    tips: [
      '涂米诺地尔后 4 小时内尽量避免大汗；可安排晨练前药或晚练后药。',
      '膝不适改快走、椭圆机或缩短跑量。',
      '循序渐进：每周总跑量增幅不宜过大。',
    ],
    videos: [
      {
        title: '跑步正确姿势入门',
        bvid: 'BV1Wt411Y7dP',
        embedUrl: bilibiliEmbed('BV1Wt411Y7dP'),
        pageUrl: 'https://www.bilibili.com/video/BV1Wt411Y7dP/',
      },
    ],
  },
  {
    id: 'swimming',
    name: '游泳',
    englishName: 'Swimming',
    image: equipmentImage('swimming.png'),
    coverTone: 'swim',
    summary: '全身低冲击有氧：对关节友好，兼具心肺与肩背、核心调动。',
    muscles: ['全身协调', '肩背', '核心', '心肺'],
    level: '入门～进阶',
    intro: [
      '游泳冲击小，适合力量训练之余补充有氧或主动恢复。',
      '自由泳效率高；仰泳对肩部友好；蛙泳节奏稳但腰部需注意姿势。',
      '以技术与呼吸节奏优先，不要盲目追求距离。',
    ],
    howTo: [
      '下水前热身肩袖与髋部，熟悉泳池深浅。',
      '以能持续游动为目标，初期可游-歇间歇（如 50 米×若干组）。',
      '换气时尽量身体转动，减少抬头憋气。',
      '结束后冲洗、补水，肩酸时减少划臂强度。',
    ],
    tips: [
      '开放水域需更加注意安全；室内池也建议结伴或告知计划。',
      '氯水后冲净头皮再涂外用药，避免刺激。',
      '耳鼻不适时缩短时长并咨询专业意见。',
    ],
    videos: [
      {
        title: '自由泳入门教学',
        bvid: 'BV1NW411z7vG',
        embedUrl: bilibiliEmbed('BV1NW411z7vG'),
        pageUrl: 'https://www.bilibili.com/video/BV1NW411z7vG/',
      },
    ],
  },
  {
    id: 'walking',
    name: '散步',
    englishName: 'Walking',
    image: equipmentImage('walking.png'),
    coverTone: 'walk',
    summary: '低强度日常活动：恢复日、饭后消化、控制久坐都很合适。',
    muscles: ['下肢轻负荷', '心肺轻刺激', '日常活动量'],
    level: '全员友好',
    intro: [
      '散步门槛最低，却是提升每日步数与代谢最稳妥的方式。',
      '力量训练次日酸痛时，用 30～60 分钟快走促进恢复。',
      '饭后散步有助于血糖平稳与消化舒适。',
    ],
    howTo: [
      '穿着舒适运动鞋，目视前方，双臂自然摆动。',
      '保持能交谈的节奏，持续 20～60 分钟。',
      '可穿插小坡或略快间歇，但不求喘息感。',
      '结束后做简单小腿与髋屈伸拉伸。',
    ],
    tips: [
      '盯手机低头走易伤颈，可规划熟悉路线。',
      '晚间散步注意安全与光线。',
      '与站立办公、爬楼结合，效果更好。',
    ],
    videos: [
      {
        title: '正确走路与散步要点',
        bvid: 'BV1iG411w7Zk',
        embedUrl: bilibiliEmbed('BV1iG411w7Zk'),
        pageUrl: 'https://www.bilibili.com/video/BV1iG411w7Zk/',
      },
    ],
  },
];

export const EQUIPMENT_LIST = [
  ...EQUIPMENT_CORE.map((item) => withKind(item, 'equipment')),
  ...EQUIPMENT_EXTRA.map((item) => withKind(item, 'equipment')),
];

export const SPORT_LIST = SPORT_LIST_RAW.map((item) => withKind(item, 'sport'));

/** 健身运动全部条目（器械 + 运动） */
export const FITNESS_LIST = [...EQUIPMENT_LIST, ...SPORT_LIST];

export const FITNESS_KIND_LABELS = {
  equipment: '健身器械',
  sport: '运动',
};

export function getEquipmentById(id) {
  return EQUIPMENT_LIST.find((item) => item.id === id) || null;
}

export function getFitnessById(id) {
  return FITNESS_LIST.find((item) => item.id === id) || null;
}

export function getFitnessKindLabel(kind) {
  return FITNESS_KIND_LABELS[kind] || '健身运动';
}
