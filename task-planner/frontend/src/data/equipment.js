/**
 * 健身房器械图鉴
 * 教学视频使用 B 站公开教程嵌入，仅作动作参考。
 * 图片 ?v= 用于强刷浏览器缓存。
 */

function bilibiliEmbed(bvid) {
  return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`;
}

const IMG_V = '20260713b';

function equipmentImage(file) {
  return `/equipment/${file}?v=${IMG_V}`;
}

export const EQUIPMENT_LIST = [
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

export function getEquipmentById(id) {
  return EQUIPMENT_LIST.find((item) => item.id === id) || null;
}
