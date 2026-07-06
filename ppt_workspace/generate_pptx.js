const pptxgen = require("pptxgenjs");
const pres = new pptxgen();

// ═══════════════════════════════════════════════════════════════
// 全局配置
// ═══════════════════════════════════════════════════════════════
pres.layout = "LAYOUT_WIDE"; // 13.3" × 7.5"
pres.author = "WorldCup Prediction Agent";
pres.title = "2026世界杯冠军预测Agent · 路演答辩";

// 色彩系统（与线上产品一致）
const C = {
  bg: "0F172A",       // 深蓝灰背景
  panel: "1E293B",    // 卡片底色
  panel2: "334155",   // 次级面板
  text: "F1F5F9",     // 主文字
  textMuted: "94A3B8", // 辅助文字
  cyan: "38BDF8",     // 主题蓝
  green: "4ADE80",    // 绿色
  gold: "FBBF24",     // 金色
  pink: "FB7185",     // 粉色
  border: "475569",   // 边框
  dark: "020617",     // 极深
};

// 字体
const FONT_H = "Arial Black";
const FONT_B = "Arial";

// 尺寸常量
const W = 13.3, H = 7.5;
const MARGIN = 0.6;

// ═══════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════

// 设置深色背景
function darkBg(slide) {
  slide.background = { color: C.bg };
}

// 添加卡片（带左侧色条）
function addCard(slide, x, y, w, h, accentColor) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: C.panel }, shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.3 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.06, h, fill: { color: accentColor }
  });
}

// 添加页面标题
function addSlideTitle(slide, text, chapter) {
  if (chapter) {
    slide.addText(chapter, {
      x: MARGIN, y: 0.25, w: W - 2 * MARGIN, h: 0.35,
      fontSize: 11, fontFace: FONT_B, color: C.textMuted, charSpacing: 4, margin: 0
    });
  }
  slide.addText(text, {
    x: MARGIN, y: 0.55, w: W - 2 * MARGIN, h: 0.65,
    fontSize: 28, fontFace: FONT_H, color: C.text, margin: 0
  });
}

// 添加底部金句
function addKeySentence(slide, text) {
  const y = H - 0.85;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y, w: W - 2 * MARGIN, h: 0.55,
    fill: { color: C.dark }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y, w: 0.06, h: 0.55, fill: { color: C.gold }
  });
  slide.addText(text, {
    x: MARGIN + 0.2, y, w: W - 2 * MARGIN - 0.4, h: 0.55,
    fontSize: 14, fontFace: FONT_B, color: C.gold, italic: true, valign: "middle", margin: 0
  });
}

// 添加数据徽章
function addBadge(slide, x, y, text, color) {
  const w = 0.08 + text.length * 0.09;
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.3, fill: { color: C.panel2 }
  });
  slide.addText(text, {
    x, y, w, h: 0.3, fontSize: 9, fontFace: FONT_B, color, align: "center", valign: "middle", margin: 0
  });
  return w;
}

// 页码
function addPageNum(slide, n) {
  slide.addText(`${n} / 20`, {
    x: W - 1.2, y: H - 0.35, w: 0.8, h: 0.25,
    fontSize: 9, fontFace: FONT_B, color: C.textMuted, align: "right", margin: 0
  });
}

// ═══════════════════════════════════════════════════════════════
// P01 封面
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);

  // 副标题装饰线
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 2.4, w: 1.5, h: 0.04, fill: { color: C.gold }
  });

  s.addText("2026 世界杯冠军预测 Agent", {
    x: MARGIN, y: 1.5, w: W - 2 * MARGIN, h: 0.9,
    fontSize: 40, fontFace: FONT_H, color: C.text, margin: 0
  });

  s.addText("一个会记忆、会想象、知道边界的预测 Agent", {
    x: MARGIN, y: 2.6, w: W - 2 * MARGIN, h: 0.5,
    fontSize: 20, fontFace: FONT_B, color: C.cyan, margin: 0
  });

  // 底部信息
  s.addText([
    { text: "线上：ainidbm.github.io/WorldCup-Prediction-mm-", options: { color: C.green, breakLine: true, fontSize: 12 } },
    { text: "GitHub：ainidbm/WorldCup-Prediction-mm-", options: { color: C.textMuted, breakLine: true, fontSize: 12 } },
    { text: "竞赛路演答辩 · 2026-07", options: { color: C.textMuted, fontSize: 12 } },
  ], {
    x: MARGIN, y: H - 1.2, w: W - 2 * MARGIN, h: 0.9, fontFace: FONT_B, margin: 0
  });

  // 右上角奖杯装饰
  s.addShape(pres.shapes.OVAL, {
    x: W - 2.0, y: 0.8, w: 1.2, h: 1.2,
    fill: { color: C.gold, transparency: 85 }, line: { color: C.gold, width: 2 }
  });
  s.addText("🏆", {
    x: W - 2.0, y: 0.8, w: 1.2, h: 1.2, fontSize: 48, align: "center", valign: "middle", margin: 0
  });
}

// ═══════════════════════════════════════════════════════════════
// P02 钩子：为什么是世界杯
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "为什么是世界杯", "序幕");

  s.addText("预测世界杯，难的从来不是建模。", {
    x: MARGIN, y: 1.3, w: W - 2 * MARGIN, h: 0.5,
    fontSize: 22, fontFace: FONT_H, color: C.cyan, margin: 0
  });

  // 三根柱卡
  const pillars = [
    { label: "真实会变", desc: "已完赛 18 场结果锁定\n赛况天天在变", color: C.cyan },
    { label: "概率要叠", desc: "10000 次模拟\n每场都要算晋级路径", color: C.green },
    { label: "必须实时", desc: "每日 UTC 06:00 自动重算\n不能算一次就死", color: C.gold },
  ];
  const pw = 3.5, gap = 0.35, startX = (W - 3 * pw - 2 * gap) / 2;
  pillars.forEach((p, i) => {
    const px = startX + i * (pw + gap);
    addCard(s, px, 2.2, pw, 2.2, p.color);
    s.addText(p.label, {
      x: px + 0.3, y: 2.4, w: pw - 0.6, h: 0.5,
      fontSize: 20, fontFace: FONT_H, color: p.color, margin: 0
    });
    s.addText(p.desc, {
      x: px + 0.3, y: 3.0, w: pw - 0.6, h: 1.2,
      fontSize: 14, fontFace: FONT_B, color: C.text, margin: 0
    });
  });

  // 落点
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 4.7, w: W - 2 * MARGIN, h: 0.85,
    fill: { color: C.dark }
  });
  s.addText("世界杯是 Agent 能力的终极试炼场：它必须在「已确定的真实」和「未发生的概率」之间持续思考。", {
    x: MARGIN + 0.3, y: 4.7, w: W - 2 * MARGIN - 0.6, h: 0.85,
    fontSize: 15, fontFace: FONT_B, color: C.text, italic: true, valign: "middle", margin: 0
  });

  addKeySentence(s, "世界杯难，不是因为建模难，是因为真实和概率要同时处理。");
  addPageNum(s, 2);
}

// ═══════════════════════════════════════════════════════════════
// P03 Agent ≠ 模型
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "Agent ≠ 模型", "Act I · Agent 如何思考");

  // 左右分屏
  const halfW = (W - 2 * MARGIN - 0.4) / 2;

  // 左：传统预测
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 1.5, w: halfW, h: 4.3,
    fill: { color: C.panel2, transparency: 50 }
  });
  s.addText("传统预测", {
    x: MARGIN + 0.3, y: 1.7, w: halfW - 0.6, h: 0.5,
    fontSize: 18, fontFace: FONT_H, color: C.textMuted, margin: 0
  });
  s.addText([
    { text: "数据 → 模型 → 柱状图", options: { breakLine: true, fontSize: 16, color: C.textMuted } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "只回答一个问题：", options: { breakLine: true, fontSize: 14, color: C.textMuted } },
    { text: "「谁赢？」", options: { fontSize: 18, color: C.textMuted, bold: true } },
  ], { x: MARGIN + 0.3, y: 2.4, w: halfW - 0.6, h: 2.5, fontFace: FONT_B, margin: 0 });

  // 右：本系统
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + halfW + 0.4, y: 1.5, w: halfW, h: 4.3,
    fill: { color: C.panel }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + halfW + 0.4, y: 1.5, w: 0.06, h: 4.3, fill: { color: C.cyan }
  });
  s.addText("本系统 · 一个 Agent", {
    x: MARGIN + halfW + 0.7, y: 1.7, w: halfW - 0.6, h: 0.5,
    fontSize: 18, fontFace: FONT_H, color: C.cyan, margin: 0
  });

  const abilities = [
    { name: "记忆", desc: "赛果锁定", color: C.cyan },
    { name: "学习", desc: "395场历史", color: C.green },
    { name: "想象", desc: "蒙特卡洛10000次", color: C.gold },
    { name: "表达", desc: "中文关键因素", color: C.pink },
    { name: "谦逊", desc: "85%上限", color: C.cyan },
  ];
  abilities.forEach((a, i) => {
    const ay = 2.4 + i * 0.6;
    s.addShape(pres.shapes.OVAL, {
      x: MARGIN + halfW + 0.7, y: ay, w: 0.35, h: 0.35, fill: { color: a.color }
    });
    s.addText([
      { text: a.name, options: { bold: true, color: a.color, fontSize: 15 } },
      { text: "  —  ", options: { color: C.textMuted, fontSize: 12 } },
      { text: a.desc, options: { color: C.text, fontSize: 13 } },
    ], { x: MARGIN + halfW + 1.2, y: ay, w: halfW - 1.0, h: 0.35, fontFace: FONT_B, valign: "middle", margin: 0 });
  });

  s.addText("模型只回答「谁赢」，Agent 要回答「凭什么、能信几成、新赛果来了怎么办」。", {
    x: MARGIN, y: 6.0, w: W - 2 * MARGIN, h: 0.4,
    fontSize: 13, fontFace: FONT_B, color: C.text, align: "center", italic: true, margin: 0
  });

  addKeySentence(s, "Agent 和模型的区别，是它知道自己能信到几成。");
  addPageNum(s, 3);
}

// ═══════════════════════════════════════════════════════════════
// P04 六步思考流程
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "六步思考流程", "Act I · Agent 如何思考");

  const steps = [
    { n: "1", tech: "加载数据", human: "记住事实", scale: "14队·72场·395历史", color: C.cyan },
    { n: "2", tech: "特征工程", human: "形成直觉", scale: "4维·10向量", color: C.green },
    { n: "3", tech: "模型训练", human: "学习历史", scale: "RF 200棵·78.99%", color: C.gold },
    { n: "4", tech: "蒙特卡洛", human: "想象未来", scale: "10000次", color: C.pink },
    { n: "5", tech: "射手预测", human: "推演个体", scale: "47名球员", color: C.cyan },
    { n: "6", tech: "JSON输出", human: "开口说话", scale: "predictions+accuracy", color: C.green },
  ];

  const stepW = 1.7, stepGap = 0.25;
  const totalW = 6 * stepW + 5 * stepGap;
  const startX = (W - totalW) / 2;

  steps.forEach((st, i) => {
    const sx = startX + i * (stepW + stepGap);
    const sy = 2.0;

    // 连线
    if (i < 5) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: sx + stepW, y: sy + 0.4, w: stepGap, h: 0.04, fill: { color: C.border }
      });
    }

    // 圆形节点
    s.addShape(pres.shapes.OVAL, {
      x: sx + stepW / 2 - 0.4, y: sy, w: 0.8, h: 0.8,
      fill: { color: C.panel }, line: { color: st.color, width: 2 }
    });
    s.addText(st.n, {
      x: sx + stepW / 2 - 0.4, y: sy, w: 0.8, h: 0.8,
      fontSize: 24, fontFace: FONT_H, color: st.color, align: "center", valign: "middle", margin: 0
    });

    // 技术名
    s.addText(st.tech, {
      x: sx, y: sy + 0.95, w: stepW, h: 0.35,
      fontSize: 13, fontFace: FONT_H, color: C.text, align: "center", margin: 0
    });
    // 人化动词
    s.addText(st.human, {
      x: sx, y: sy + 1.3, w: stepW, h: 0.3,
      fontSize: 12, fontFace: FONT_B, color: st.color, align: "center", italic: true, margin: 0
    });
    // 数据徽章
    s.addShape(pres.shapes.RECTANGLE, {
      x: sx + 0.15, y: sy + 1.7, w: stepW - 0.3, h: 0.3,
      fill: { color: C.dark }
    });
    s.addText(st.scale, {
      x: sx + 0.15, y: sy + 1.7, w: stepW - 0.3, h: 0.3,
      fontSize: 8, fontFace: FONT_B, color: C.textMuted, align: "center", valign: "middle", margin: 0
    });
  });

  // 主线索句
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 5.0, w: W - 2 * MARGIN, h: 0.8,
    fill: { color: C.dark }
  });
  s.addText("它记住已发生的，学习过去的，想象一万种未来，用人话说出判断，并清楚自己能信到几成。", {
    x: MARGIN + 0.3, y: 5.0, w: W - 2 * MARGIN - 0.6, h: 0.8,
    fontSize: 15, fontFace: FONT_B, color: C.gold, italic: true, valign: "middle", margin: 0
  });

  addKeySentence(s, "六步不是管线，是一个会思考的过程。");
  addPageNum(s, 4);
}

// ═══════════════════════════════════════════════════════════════
// P05 特征工程：Agent 的直觉从哪来
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "特征工程：Agent 的直觉从哪来", "Act I · Agent 如何思考");

  const features = [
    { name: "近期状态", weight: "40%", human: "最近踢得怎样", calc: "积分50% + 净胜球30% + 进球20%", color: C.cyan },
    { name: "硬实力", weight: "30%", human: "家底有多厚", calc: "FIFA40% + 身价35% + 历史25%", color: C.green },
    { name: "交锋记录", weight: "15%", human: "历史谁克谁", calc: "395场历史胜平负概率", color: C.gold },
    { name: "情境因素", weight: "15%", human: "东道主与经验", calc: "东道主40% + 经验35% + 年龄25%", color: C.pink },
  ];

  // 四个特征卡（2x2网格）
  const fw = 5.5, fh = 1.5, fgap = 0.3;
  const fStartX = (W - 2 * fw - fgap) / 2;
  features.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const fx = fStartX + col * (fw + fgap);
    const fy = 1.5 + row * (fh + fgap);

    addCard(s, fx, fy, fw, fh, f.color);

    s.addText(f.name, {
      x: fx + 0.3, y: fy + 0.15, w: 3, h: 0.4,
      fontSize: 16, fontFace: FONT_H, color: f.color, margin: 0
    });
    s.addText(f.weight, {
      x: fx + fw - 1.3, y: fy + 0.15, w: 1, h: 0.4,
      fontSize: 22, fontFace: FONT_H, color: f.color, align: "right", margin: 0
    });
    s.addText([
      { text: f.human, options: { color: C.text, fontSize: 13, italic: true, breakLine: true } },
      { text: f.calc, options: { color: C.textMuted, fontSize: 11 } },
    ], { x: fx + 0.3, y: fy + 0.6, w: fw - 0.6, h: 0.7, fontFace: FONT_B, margin: 0 });
  });

  // 关键决策标注
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 5.1, w: W - 2 * MARGIN, h: 0.6,
    fill: { color: C.dark }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 5.1, w: 0.06, h: 0.6, fill: { color: C.gold }
  });
  s.addText([
    { text: "关键决策：", options: { bold: true, color: C.gold, fontSize: 13 } },
    { text: "这 4 维权重只用于展示，模型用原始 10 维特征训练（见 Act II 决策一）", options: { color: C.text, fontSize: 13 } },
  ], { x: MARGIN + 0.3, y: 5.1, w: W - 2 * MARGIN - 0.6, h: 0.6, fontFace: FONT_B, valign: "middle", margin: 0 });

  addKeySentence(s, "它的直觉来自四件事：状态、实力、交锋、情境。");
  addPageNum(s, 5);
}

// ═══════════════════════════════════════════════════════════════
// P06 蒙特卡洛：想象一万种未来
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "蒙特卡洛：想象一万种未来", "Act I · Agent 如何思考");

  s.addText("同一个赛程，跑一万遍，数谁拿冠军最多。", {
    x: MARGIN, y: 1.3, w: W - 2 * MARGIN, h: 0.4,
    fontSize: 16, fontFace: FONT_B, color: C.cyan, italic: true, margin: 0
  });

  // Before/After 对比
  const halfW = (W - 2 * MARGIN - 0.6) / 2;

  // 左：朴素做法
  addCard(s, MARGIN, 2.0, halfW, 2.8, C.pink);
  s.addText("朴素做法", {
    x: MARGIN + 0.3, y: 2.15, w: halfW - 0.6, h: 0.4,
    fontSize: 18, fontFace: FONT_H, color: C.pink, margin: 0
  });
  s.addText("310,000", {
    x: MARGIN + 0.3, y: 2.6, w: halfW - 0.6, h: 0.8,
    fontSize: 48, fontFace: FONT_H, color: C.pink, margin: 0
  });
  s.addText("次模型调用", {
    x: MARGIN + 0.3, y: 3.4, w: halfW - 0.6, h: 0.35,
    fontSize: 16, fontFace: FONT_B, color: C.textMuted, margin: 0
  });
  // 长条
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + 0.3, y: 3.9, w: halfW - 0.6, h: 0.35, fill: { color: C.pink, transparency: 30 }
  });
  s.addText("> 60 秒", {
    x: MARGIN + 0.3, y: 3.9, w: halfW - 0.6, h: 0.35,
    fontSize: 14, fontFace: FONT_H, color: C.text, align: "center", valign: "middle", margin: 0
  });

  // 右：预计算后
  addCard(s, MARGIN + halfW + 0.6, 2.0, halfW, 2.8, C.green);
  s.addText("预计算后", {
    x: MARGIN + halfW + 0.9, y: 2.15, w: halfW - 0.6, h: 0.4,
    fontSize: 18, fontFace: FONT_H, color: C.green, margin: 0
  });
  s.addText("496", {
    x: MARGIN + halfW + 0.9, y: 2.6, w: halfW - 0.6, h: 0.8,
    fontSize: 48, fontFace: FONT_H, color: C.green, margin: 0
  });
  s.addText("次调用（91 组对阵预计算）", {
    x: MARGIN + halfW + 0.9, y: 3.4, w: halfW - 0.6, h: 0.35,
    fontSize: 16, fontFace: FONT_B, color: C.textMuted, margin: 0
  });
  // 短条
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + halfW + 0.9, y: 3.9, w: 1.5, h: 0.35, fill: { color: C.green, transparency: 20 }
  });
  s.addText("< 2 秒", {
    x: MARGIN + halfW + 0.9, y: 3.9, w: 1.5, h: 0.35,
    fontSize: 14, fontFace: FONT_H, color: C.text, align: "center", valign: "middle", margin: 0
  });

  // 100x+ 标注
  s.addShape(pres.shapes.OVAL, {
    x: W / 2 - 0.9, y: 3.2, w: 1.8, h: 1.2,
    fill: { color: C.gold }, shadow: { type: "outer", color: "000000", blur: 12, offset: 3, angle: 135, opacity: 0.4 }
  });
  s.addText("100x+", {
    x: W / 2 - 0.9, y: 3.2, w: 1.8, h: 0.8,
    fontSize: 28, fontFace: FONT_H, color: C.dark, align: "center", valign: "middle", margin: 0
  });
  s.addText("提速", {
    x: W / 2 - 0.9, y: 3.9, w: 1.8, h: 0.4,
    fontSize: 12, fontFace: FONT_B, color: C.dark, align: "center", margin: 0
  });

  s.addText("不是算得慢就认真，预计算让「想象一万次」变成可日常运行的事。", {
    x: MARGIN, y: 5.2, w: W - 2 * MARGIN, h: 0.4,
    fontSize: 14, fontFace: FONT_B, color: C.text, align: "center", italic: true, margin: 0
  });

  addKeySentence(s, "它想象一万种未来，但因为预计算，只要两秒。");
  addPageNum(s, 6);
}

// ═══════════════════════════════════════════════════════════════
// P07 记忆与谦逊
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "记忆与谦逊", "Act I · Agent 如何思考");

  const halfW = (W - 2 * MARGIN - 0.5) / 2;

  // 左卡：记忆
  addCard(s, MARGIN, 1.5, halfW, 4.0, C.cyan);
  s.addShape(pres.shapes.OVAL, {
    x: MARGIN + 0.3, y: 1.75, w: 0.5, h: 0.5, fill: { color: C.cyan }
  });
  s.addText("🔒", {
    x: MARGIN + 0.3, y: 1.75, w: 0.5, h: 0.5, fontSize: 20, align: "center", valign: "middle", margin: 0
  });
  s.addText("记忆 · 渐进式赛果融合", {
    x: MARGIN + 1.0, y: 1.75, w: halfW - 1.3, h: 0.5,
    fontSize: 17, fontFace: FONT_H, color: C.cyan, valign: "middle", margin: 0
  });
  s.addText([
    { text: "已完赛 18 场真实结果锁定进模拟", options: { breakLine: true, fontSize: 14, color: C.text } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "剩余只推演未完成场次", options: { breakLine: true, fontSize: 14, color: C.text } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "随赛况进化，越往后越准", options: { fontSize: 14, color: C.text } },
  ], { x: MARGIN + 0.3, y: 2.5, w: halfW - 0.6, h: 2.5, fontFace: FONT_B, margin: 0 });

  // 右卡：谦逊
  addCard(s, MARGIN + halfW + 0.5, 1.5, halfW, 4.0, C.gold);
  s.addShape(pres.shapes.OVAL, {
    x: MARGIN + halfW + 0.8, y: 1.75, w: 0.5, h: 0.5, fill: { color: C.gold }
  });
  s.addText("🛡️", {
    x: MARGIN + halfW + 0.8, y: 1.75, w: 0.5, h: 0.5, fontSize: 20, align: "center", valign: "middle", margin: 0
  });
  s.addText("谦逊 · 85% 胜率硬上限", {
    x: MARGIN + halfW + 1.5, y: 1.75, w: halfW - 1.8, h: 0.5,
    fontSize: 17, fontFace: FONT_H, color: C.gold, valign: "middle", margin: 0
  });
  s.addText([
    { text: "超出 85% 的部分按比例退给平局和对手", options: { breakLine: true, fontSize: 14, color: C.text } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "再强也不说自己稳赢", options: { breakLine: true, fontSize: 14, color: C.text } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "防过度自信的设计红线", options: { fontSize: 14, color: C.text } },
  ], { x: MARGIN + halfW + 0.8, y: 2.5, w: halfW - 1.0, h: 2.5, fontFace: FONT_B, margin: 0 });

  // 85% 红线示意
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + halfW + 0.8, y: 4.5, w: halfW - 1.0, h: 0.25, fill: { color: C.panel2 }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + halfW + 0.8, y: 4.5, w: (halfW - 1.0) * 0.85, h: 0.25, fill: { color: C.green }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + halfW + 0.8 + (halfW - 1.0) * 0.85, y: 4.45, w: 0.03, h: 0.35, fill: { color: C.pink }
  });
  s.addText("85% 上限", {
    x: MARGIN + halfW + 0.8 + (halfW - 1.0) * 0.85 - 1.0, y: 4.8, w: 1.2, h: 0.25,
    fontSize: 9, fontFace: FONT_B, color: C.pink, align: "center", margin: 0
  });

  s.addText("记忆让它随赛况进化，谦逊让它不翻车。", {
    x: MARGIN, y: 5.8, w: W - 2 * MARGIN, h: 0.4,
    fontSize: 15, fontFace: FONT_B, color: C.text, align: "center", italic: true, margin: 0
  });

  addKeySentence(s, "它把已踢完的锁住，再强也只敢说八成五。");
  addPageNum(s, 7);
}

// ═══════════════════════════════════════════════════════════════
// P08 四层架构总览
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "四层架构总览", "Act II · 架构如何支撑");

  const layers = [
    { name: "数据层", duty: "管「事实」", items: "teams.json · group_results · knockout_bracket · historical.csv(395场)", color: C.cyan },
    { name: "预测引擎层", duty: "管「思考」", items: "features → model → monte_carlo → output → top_scorer · 7个后端模块", color: C.green },
    { name: "可视化层", duty: "管「翻译」", items: "React 19 + TypeScript + Recharts + SVG · 4大组件", color: C.gold },
    { name: "部署层", duty: "管「活着」", items: "GitHub Actions → Pages · CI/CD 全自动", color: C.pink },
  ];

  const lh = 1.0, lgap = 0.2;
  layers.forEach((l, i) => {
    const ly = 1.5 + i * (lh + lgap);
    s.addShape(pres.shapes.RECTANGLE, {
      x: MARGIN, y: ly, w: W - 2 * MARGIN, h: lh,
      fill: { color: C.panel }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: MARGIN, y: ly, w: 0.08, h: lh, fill: { color: l.color }
    });
    s.addText(l.name, {
      x: MARGIN + 0.3, y: ly + 0.1, w: 2.5, h: 0.4,
      fontSize: 18, fontFace: FONT_H, color: l.color, margin: 0
    });
    s.addText(l.duty, {
      x: MARGIN + 3.0, y: ly + 0.1, w: 2, h: 0.4,
      fontSize: 14, fontFace: FONT_B, color: C.text, italic: true, margin: 0
    });
    s.addText(l.items, {
      x: MARGIN + 0.3, y: ly + 0.55, w: W - 2 * MARGIN - 0.6, h: 0.35,
      fontSize: 11, fontFace: FONT_B, color: C.textMuted, margin: 0
    });
  });

  // 提示
  s.addText("接下来三页，不讲「是什么」，讲「为什么这么搭」。", {
    x: MARGIN, y: 6.0, w: W - 2 * MARGIN, h: 0.35,
    fontSize: 13, fontFace: FONT_B, color: C.cyan, align: "center", italic: true, margin: 0
  });

  addKeySentence(s, "四层，每层只干一件事，边界清楚。");
  addPageNum(s, 8);
}

// ═══════════════════════════════════════════════════════════════
// P09 决策一：模型与可解释性分离
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "决策一：模型与可解释性分离", "Act II · 架构如何支撑");

  // 问题
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 1.4, w: W - 2 * MARGIN, h: 0.6, fill: { color: C.dark }
  });
  s.addText([
    { text: "问题：", options: { bold: true, color: C.pink, fontSize: 14 } },
    { text: "如果用 4 维加权直接训练，模型会过拟合权重，且黑箱不可解释", options: { color: C.text, fontSize: 14 } },
  ], { x: MARGIN + 0.2, y: 1.4, w: W - 2 * MARGIN - 0.4, h: 0.6, fontFace: FONT_B, valign: "middle", margin: 0 });

  // A/B 对比
  const halfW = (W - 2 * MARGIN - 0.5) / 2;

  // 方案A
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 2.2, w: halfW, h: 2.0, fill: { color: C.panel2, transparency: 40 }
  });
  s.addText("方案 A", {
    x: MARGIN + 0.3, y: 2.35, w: halfW - 0.6, h: 0.4,
    fontSize: 16, fontFace: FONT_H, color: C.textMuted, margin: 0
  });
  s.addText("权重即特征\n简单但黑箱", {
    x: MARGIN + 0.3, y: 2.8, w: halfW - 0.6, h: 0.8,
    fontSize: 14, fontFace: FONT_B, color: C.textMuted, margin: 0
  });
  s.addText("✗", {
    x: MARGIN + halfW - 0.7, y: 2.3, w: 0.5, h: 0.5,
    fontSize: 24, fontFace: FONT_H, color: C.pink, align: "center", margin: 0
  });

  // 方案B（选中）
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + halfW + 0.5, y: 2.2, w: halfW, h: 2.0, fill: { color: C.panel }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN + halfW + 0.5, y: 2.2, w: 0.06, h: 2.0, fill: { color: C.green }
  });
  s.addText("方案 B ✓", {
    x: MARGIN + halfW + 0.8, y: 2.35, w: halfW - 0.6, h: 0.4,
    fontSize: 16, fontFace: FONT_H, color: C.green, margin: 0
  });
  s.addText("原始特征训练 + 4 维仅展示\n复杂但双解释层", {
    x: MARGIN + halfW + 0.8, y: 2.8, w: halfW - 0.6, h: 0.8,
    fontSize: 14, fontFace: FONT_B, color: C.text, margin: 0
  });

  // 选择说明
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 4.4, w: W - 2 * MARGIN, h: 0.55, fill: { color: C.dark }
  });
  s.addText([
    { text: "选择 B：", options: { bold: true, color: C.green, fontSize: 13 } },
    { text: "随机森林吃 10 维原始特征训练；4 维权重 (40/30/15/15) 只生成中文关键因素给前端展示", options: { color: C.text, fontSize: 13 } },
  ], { x: MARGIN + 0.2, y: 4.4, w: W - 2 * MARGIN - 0.4, h: 0.55, fontFace: FONT_B, valign: "middle", margin: 0 });

  // 证据
  s.addText([
    { text: "证据：", options: { bold: true, color: C.gold, fontSize: 13 } },
    { text: "比赛旁出现 ", options: { color: C.text, fontSize: 13 } },
  ], { x: MARGIN, y: 5.2, w: 1.3, h: 0.4, fontFace: FONT_B, margin: 0 });

  const badges = ["法国整体实力占优", "摩洛哥近期状态更佳", "法国大赛底蕴更深"];
  let bx = MARGIN + 1.35;
  badges.forEach(b => {
    const bw = 0.18 + b.length * 0.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x: bx, y: 5.2, w: bw, h: 0.35, fill: { color: C.panel2 }
    });
    s.addText(b, {
      x: bx, y: 5.2, w: bw, h: 0.35, fontSize: 10, fontFace: FONT_B, color: C.cyan, align: "center", valign: "middle", margin: 0
    });
    bx += bw + 0.15;
  });

  addKeySentence(s, "模型归模型，解释归解释，两层分开才都稳。");
  addPageNum(s, 9);
}

// ═══════════════════════════════════════════════════════════════
// P10 决策二：概率预计算 + 静态部署
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "决策二：概率预计算 + 静态部署", "Act II · 架构如何支撑");

  // 因果链
  const chain = [
    { text: "310,000次", color: C.pink },
    { text: "预计算91组", color: C.gold },
    { text: "496次", color: C.cyan },
    { text: "<2秒", color: C.green },
    { text: "敢塞进CI", color: C.cyan },
    { text: "纯静态Pages", color: C.green },
  ];

  const nodeW = 1.6, nodeGap = 0.35;
  const totalW = 6 * nodeW + 5 * nodeGap;
  const startX = (W - totalW) / 2;

  chain.forEach((node, i) => {
    const nx = startX + i * (nodeW + nodeGap);
    const ny = 2.2;

    // 箭头连线
    if (i < 5) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: nx + nodeW, y: ny + 0.28, w: nodeGap, h: 0.04, fill: { color: C.border }
      });
      s.addText("→", {
        x: nx + nodeW - 0.05, y: ny + 0.1, w: nodeGap + 0.1, h: 0.4,
        fontSize: 20, fontFace: FONT_H, color: C.border, align: "center", valign: "middle", margin: 0
      });
    }

    // 节点
    s.addShape(pres.shapes.RECTANGLE, {
      x: nx, y: ny, w: nodeW, h: 0.6, fill: { color: C.panel }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: nx, y: ny, w: nodeW, h: 0.04, fill: { color: node.color }
    });
    s.addText(node.text, {
      x: nx, y: ny, w: nodeW, h: 0.6,
      fontSize: 13, fontFace: FONT_H, color: node.color, align: "center", valign: "middle", margin: 0
    });
  });

  // 说明区域
  const explanations = [
    { label: "性能墙", text: "朴素蒙特卡洛 310000 次调用，>60 秒，CI 里跑不动", color: C.pink },
    { label: "解法", text: "14 队两两预计算 91 组对阵概率，模拟内只查表，调用降到 496 次", color: C.cyan },
    { label: "连带决策", text: "因为算得快，敢做纯静态部署 — 所有计算在 CI 跑完，GitHub Pages 只发静态文件，零服务端依赖", color: C.green },
  ];

  explanations.forEach((e, i) => {
    const ey = 3.3 + i * 0.75;
    addCard(s, MARGIN, ey, W - 2 * MARGIN, 0.65, e.color);
    s.addText(e.label, {
      x: MARGIN + 0.3, y: ey, w: 1.5, h: 0.65,
      fontSize: 13, fontFace: FONT_H, color: e.color, valign: "middle", margin: 0
    });
    s.addText(e.text, {
      x: MARGIN + 2.0, y: ey, w: W - 2 * MARGIN - 2.3, h: 0.65,
      fontSize: 13, fontFace: FONT_B, color: C.text, valign: "middle", margin: 0
    });
  });

  addKeySentence(s, "算得快，才敢把后端塞进 CI，前端纯静态。");
  addPageNum(s, 10);
}

// ═══════════════════════════════════════════════════════════════
// P11 CI/CD 全自动流水线
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "CI/CD 全自动流水线", "Act II · 架构如何支撑");

  // 三个统计卡片
  const stats = [
    { num: "06:00", label: "每日自动触发", desc: "UTC 06:00 定时跑\n零人工干预", color: C.cyan },
    { num: "10步", label: "CI/CD 管线", desc: "checkout → build → deploy\n全链路自动化", color: C.green },
    { num: "0", label: "服务端依赖", desc: "GitHub Pages 纯静态\n零成本 · 零运维", color: C.gold },
  ];

  const cardW = (W - 2 * MARGIN - 2 * 0.4) / 3;
  stats.forEach((st, i) => {
    const sx = MARGIN + i * (cardW + 0.4);
    addCard(s, sx, 1.5, cardW, 2.5, st.color);
    s.addText(st.num, {
      x: sx + 0.3, y: 1.7, w: cardW - 0.6, h: 0.8,
      fontSize: 36, fontFace: FONT_H, color: st.color, align: "center", margin: 0
    });
    s.addText(st.label, {
      x: sx + 0.3, y: 2.5, w: cardW - 0.6, h: 0.4,
      fontSize: 16, fontFace: FONT_H, color: C.text, align: "center", margin: 0
    });
    s.addText(st.desc, {
      x: sx + 0.3, y: 2.9, w: cardW - 0.6, h: 0.9,
      fontSize: 12, fontFace: FONT_B, color: C.textMuted, align: "center", margin: 0
    });
  });

  // 部署策略说明
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 4.3, w: W - 2 * MARGIN, h: 0.55, fill: { color: C.dark }
  });
  s.addText([
    { text: "部署策略：", options: { bold: true, color: C.gold, fontSize: 13 } },
    { text: "所有计算在 CI 跑完，GitHub Pages 只发静态文件。用户永远看到最新预测，无需服务端。", options: { color: C.text, fontSize: 13 } },
  ], { x: MARGIN + 0.2, y: 4.3, w: W - 2 * MARGIN - 0.4, h: 0.55, fontFace: FONT_B, valign: "middle", margin: 0 });

  // CI/CD 10步
  s.addText("CI/CD 10 步管线：", {
    x: MARGIN, y: 5.1, w: 2, h: 0.3,
    fontSize: 11, fontFace: FONT_B, color: C.textMuted, margin: 0
  });
  const ciSteps = ["checkout", "py3.12", "pip", "main.py", "node20", "npm ci", "build", "cp json", "artifact", "pages"];
  let cx = MARGIN + 2.0;
  ciSteps.forEach((step, i) => {
    const sw = 0.15 + step.length * 0.085;
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 5.1, w: sw, h: 0.28, fill: { color: C.panel2 }
    });
    s.addText(step, {
      x: cx, y: 5.1, w: sw, h: 0.28, fontSize: 8, fontFace: FONT_B, color: i < 4 ? C.cyan : i < 7 ? C.green : C.gold, align: "center", valign: "middle", margin: 0
    });
    cx += sw + 0.08;
  });

  addKeySentence(s, "算完就发，零服务端，零运维。");
  addPageNum(s, 11);
}

// ═══════════════════════════════════════════════════════════════
// P12 八轮迭代地图
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "八轮迭代地图", "Act III · 工具链如何落地");

  // 时间轴
  const phases = [
    { rounds: "1-3", phase: "从 0 到 1", theme: "打地基：代码 · 文档 · 数据", color: C.cyan },
    { rounds: "4-6", phase: "核心演进", theme: "进化：过滤 · 比分 · 像样", color: C.green },
    { rounds: "7-8", phase: "上线交付", theme: "收口：文档 · 上线", color: C.gold },
  ];

  // 8个圆点
  const dotW = 0.5, dotGap = 0.3;
  const totalW = 8 * dotW + 7 * dotGap;
  const startX = (W - totalW) / 2;
  const dotY = 2.3;

  for (let i = 0; i < 8; i++) {
    const dx = startX + i * (dotW + dotGap);
    const phaseIdx = i < 3 ? 0 : i < 6 ? 1 : 2;
    const color = phases[phaseIdx].color;

    // 连线
    if (i < 7) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: dx + dotW, y: dotY + dotW / 2 - 0.02, w: dotGap, h: 0.04, fill: { color: C.border }
      });
    }

    s.addShape(pres.shapes.OVAL, {
      x: dx, y: dotY, w: dotW, h: dotW, fill: { color: C.panel }, line: { color, width: 2 }
    });
    s.addText(`${i + 1}`, {
      x: dx, y: dotY, w: dotW, h: dotW, fontSize: 16, fontFace: FONT_H, color, align: "center", valign: "middle", margin: 0
    });

    // handoff 标注
    if (i < 7) {
      s.addText("handoff", {
        x: dx + dotW, y: dotY + dotW + 0.05, w: dotGap, h: 0.2,
        fontSize: 7, fontFace: FONT_B, color: C.textMuted, align: "center", margin: 0
      });
    }
  }

  // 三段卡片
  const phaseW = (totalW - 2 * 0.8) / 3;
  phases.forEach((p, i) => {
    const px = startX + i * (phaseW + 0.8);
    addCard(s, px, 3.5, phaseW, 1.8, p.color);
    s.addText(`轮 ${p.rounds}`, {
      x: px + 0.2, y: 3.65, w: phaseW - 0.4, h: 0.35,
      fontSize: 14, fontFace: FONT_H, color: p.color, margin: 0
    });
    s.addText(p.phase, {
      x: px + 0.2, y: 4.0, w: phaseW - 0.4, h: 0.35,
      fontSize: 16, fontFace: FONT_H, color: C.text, margin: 0
    });
    s.addText(p.theme, {
      x: px + 0.2, y: 4.4, w: phaseW - 0.4, h: 0.7,
      fontSize: 12, fontFace: FONT_B, color: C.textMuted, margin: 0
    });
  });

  s.addText("这不是一次成型，是一个真实迭代过程，每轮都用 handoff skill 交接上下文。", {
    x: MARGIN, y: 5.7, w: W - 2 * MARGIN, h: 0.35,
    fontSize: 13, fontFace: FONT_B, color: C.text, align: "center", italic: true, margin: 0
  });

  addKeySentence(s, "八轮迭代，handoff 接力，每轮解决一个真问题。");
  addPageNum(s, 12);
}

// ═══════════════════════════════════════════════════════════════
// P13 第一阶段：从0到1（轮1-3）
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "第一阶段：从 0 到 1（轮 1-3）", "Act III · 工具链如何落地");

  const rounds = [
    { n: "轮 1", problem: "从零搭一个全栈预测系统", tool: "WorkBuddy 多 Task 编排（12个Task：7后端+5前端+CI/CD）", breakthrough: "一次会话产出可运行全栈", color: C.cyan },
    { n: "轮 2", problem: "代码有了但缺架构文档", tool: "Qoder RepoWiki 自动生成知识库", breakthrough: "6页架构文档 + 3张知识卡", color: C.green },
    { n: "轮 3", problem: "训练数据只有 117 场，太少", tool: "openfootball/worldcup.json + euro.json + 清洗脚本", breakthrough: "117 → 395 场，身价单位统一", color: C.gold },
  ];

  const cardW = (W - 2 * MARGIN - 2 * 0.3) / 3;
  rounds.forEach((r, i) => {
    const rx = MARGIN + i * (cardW + 0.3);
    addCard(s, rx, 1.5, cardW, 4.0, r.color);

    s.addText(r.n, {
      x: rx + 0.3, y: 1.65, w: cardW - 0.6, h: 0.4,
      fontSize: 18, fontFace: FONT_H, color: r.color, margin: 0
    });

    // 问题
    s.addText("问题", {
      x: rx + 0.3, y: 2.2, w: cardW - 0.6, h: 0.25,
      fontSize: 10, fontFace: FONT_B, color: C.pink, margin: 0
    });
    s.addText(r.problem, {
      x: rx + 0.3, y: 2.45, w: cardW - 0.6, h: 0.5,
      fontSize: 13, fontFace: FONT_B, color: C.text, margin: 0
    });

    // 工具
    s.addText("工具", {
      x: rx + 0.3, y: 3.1, w: cardW - 0.6, h: 0.25,
      fontSize: 10, fontFace: FONT_B, color: C.cyan, margin: 0
    });
    s.addText(r.tool, {
      x: rx + 0.3, y: 3.35, w: cardW - 0.6, h: 0.7,
      fontSize: 12, fontFace: FONT_B, color: C.text, margin: 0
    });

    // 突破
    s.addText("突破", {
      x: rx + 0.3, y: 4.2, w: cardW - 0.6, h: 0.25,
      fontSize: 10, fontFace: FONT_B, color: C.green, margin: 0
    });
    s.addText(r.breakthrough, {
      x: rx + 0.3, y: 4.45, w: cardW - 0.6, h: 0.7,
      fontSize: 13, fontFace: FONT_H, color: C.green, margin: 0
    });
  });

  addKeySentence(s, "前三轮打地基：代码、文档、数据。");
  addPageNum(s, 13);
}

// ═══════════════════════════════════════════════════════════════
// P14 第二阶段：核心演进（轮4-6）
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "第二阶段：核心演进（轮 4-6）", "Act III · 工具链如何落地");

  const rounds = [
    { n: "轮 4", problem: "模拟按全部 32 队跑，已淘汰队伍污染预测", tool: "actual_results 赛果注入 + KnockoutProgress 组件 + Vite 分包", breakthrough: "32→14队过滤，回测扩到90场，包体547KB→193KB", color: C.green },
    { n: "轮 5", problem: "只预测谁赢，不够直观", tool: "Poisson PMF 比分预测 + CSS badge", breakthrough: "每场给出预测比分（如巴西 2-1 挪威）", color: C.gold },
    { n: "轮 6", problem: "纯 Poisson 比分太保守（全是 1-0）", tool: "参数调优 (decay 0.72→0.85 · blend 60:40→30:70) + 平局修正", breakthrough: "比分多样化（2-1 / 0-2 / 3-0 都有）", color: C.pink },
  ];

  const cardW = (W - 2 * MARGIN - 2 * 0.3) / 3;
  rounds.forEach((r, i) => {
    const rx = MARGIN + i * (cardW + 0.3);
    addCard(s, rx, 1.5, cardW, 4.0, r.color);

    s.addText(r.n, {
      x: rx + 0.3, y: 1.65, w: cardW - 0.6, h: 0.4,
      fontSize: 18, fontFace: FONT_H, color: r.color, margin: 0
    });

    s.addText("问题", { x: rx + 0.3, y: 2.2, w: cardW - 0.6, h: 0.25, fontSize: 10, fontFace: FONT_B, color: C.pink, margin: 0 });
    s.addText(r.problem, { x: rx + 0.3, y: 2.45, w: cardW - 0.6, h: 0.6, fontSize: 12, fontFace: FONT_B, color: C.text, margin: 0 });

    s.addText("工具", { x: rx + 0.3, y: 3.2, w: cardW - 0.6, h: 0.25, fontSize: 10, fontFace: FONT_B, color: C.cyan, margin: 0 });
    s.addText(r.tool, { x: rx + 0.3, y: 3.45, w: cardW - 0.6, h: 0.8, fontSize: 11, fontFace: FONT_B, color: C.text, margin: 0 });

    s.addText("突破", { x: rx + 0.3, y: 4.4, w: cardW - 0.6, h: 0.25, fontSize: 10, fontFace: FONT_B, color: C.green, margin: 0 });
    s.addText(r.breakthrough, { x: rx + 0.3, y: 4.65, w: cardW - 0.6, h: 0.7, fontSize: 12, fontFace: FONT_H, color: C.green, margin: 0 });
  });

  // 比分演进示意
  s.addText("比分演进：", {
    x: MARGIN, y: 5.8, w: 1.2, h: 0.3, fontSize: 11, fontFace: FONT_B, color: C.textMuted, margin: 0
  });
  const scores = [
    { text: "1-0", color: C.textMuted, label: "轮5" },
    { text: "→", color: C.textMuted },
    { text: "2-1", color: C.green, label: "轮6" },
    { text: "0-2", color: C.gold },
    { text: "3-0", color: C.cyan },
  ];
  let sx = MARGIN + 1.3;
  scores.forEach(sc => {
    const sw = sc.text.length * 0.15 + 0.3;
    if (sc.text !== "→") {
      s.addShape(pres.shapes.RECTANGLE, { x: sx, y: 5.8, w: sw, h: 0.3, fill: { color: C.panel2 } });
    }
    s.addText(sc.text, { x: sx, y: 5.8, w: sw, h: 0.3, fontSize: 12, fontFace: FONT_H, color: sc.color, align: "center", valign: "middle", margin: 0 });
    sx += sw + 0.15;
  });

  addKeySentence(s, "三轮核心进化：先算对谁晋级，再算比分，最后让比分像真比赛。");
  addPageNum(s, 14);
}

// ═══════════════════════════════════════════════════════════════
// P15 第三阶段：上线交付（轮7-8）
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "第三阶段：上线交付（轮 7-8）", "Act III · 工具链如何落地");

  const halfW = (W - 2 * MARGIN - 0.5) / 2;

  const rounds = [
    { n: "轮 7", problem: "要参赛提交，得有完整答辩材料", tool: "通读全部源码 + 撰写 competition-submission.md", breakthrough: "覆盖架构30分 / 可视化30分 / 创新20分 / 加分项完整文档", color: C.gold },
    { n: "轮 8", problem: "要让评委能在线访问，得部署上线", tool: "GitHub Actions CI/CD + Pages 静态部署 + Vite 构建 + 自动重算", breakthrough: "每日 UTC 06:00 自动重算，零服务端依赖，零成本", color: C.green },
  ];

  rounds.forEach((r, i) => {
    const rx = MARGIN + i * (halfW + 0.5);
    addCard(s, rx, 1.5, halfW, 4.2, r.color);

    s.addText(r.n, {
      x: rx + 0.3, y: 1.65, w: halfW - 0.6, h: 0.4,
      fontSize: 18, fontFace: FONT_H, color: r.color, margin: 0
    });

    s.addText("问题", { x: rx + 0.3, y: 2.2, w: halfW - 0.6, h: 0.25, fontSize: 10, fontFace: FONT_B, color: C.pink, margin: 0 });
    s.addText(r.problem, { x: rx + 0.3, y: 2.45, w: halfW - 0.6, h: 0.5, fontSize: 13, fontFace: FONT_B, color: C.text, margin: 0 });

    s.addText("工具", { x: rx + 0.3, y: 3.1, w: halfW - 0.6, h: 0.25, fontSize: 10, fontFace: FONT_B, color: C.cyan, margin: 0 });
    s.addText(r.tool, { x: rx + 0.3, y: 3.35, w: halfW - 0.6, h: 0.8, fontSize: 12, fontFace: FONT_B, color: C.text, margin: 0 });

    s.addText("突破", { x: rx + 0.3, y: 4.3, w: halfW - 0.6, h: 0.25, fontSize: 10, fontFace: FONT_B, color: C.green, margin: 0 });
    s.addText(r.breakthrough, { x: rx + 0.3, y: 4.55, w: halfW - 0.6, h: 0.9, fontSize: 13, fontFace: FONT_H, color: C.green, margin: 0 });
  });

  addKeySentence(s, "最后两轮：先写成文档，再做成能看的线上服务。");
  addPageNum(s, 15);
}

// ═══════════════════════════════════════════════════════════════
// P16 冠军预测：法国 19.51%
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "冠军预测：法国 19.51%", "Act IV · 结果有多准");

  // 左：条形图
  const teams = [
    { name: "法国", prob: 19.51, color: C.cyan },
    { name: "巴西", prob: 14.62, color: C.green },
    { name: "摩洛哥", prob: 13.82, color: C.gold },
    { name: "哥伦比亚", prob: 9.84, color: C.pink },
    { name: "比利时", prob: 7.89, color: C.cyan },
  ];

  const chartW = 5.5, barH = 0.5, barGap = 0.25;
  teams.forEach((t, i) => {
    const by = 1.8 + i * (barH + barGap);
    s.addText(t.name, { x: MARGIN, y: by, w: 1.2, h: barH, fontSize: 14, fontFace: FONT_B, color: C.text, valign: "middle", margin: 0 });
    // 背景条
    s.addShape(pres.shapes.RECTANGLE, { x: MARGIN + 1.3, y: by, w: chartW, h: barH, fill: { color: C.panel2, transparency: 50 } });
    // 数据条
    s.addShape(pres.shapes.RECTANGLE, { x: MARGIN + 1.3, y: by, w: chartW * (t.prob / 20), h: barH, fill: { color: t.color, transparency: 20 } });
    s.addText(`${t.prob}%`, { x: MARGIN + 1.3 + chartW * (t.prob / 20) + 0.1, y: by, w: 1, h: barH, fontSize: 14, fontFace: FONT_H, color: t.color, valign: "middle", margin: 0 });
  });

  // 右：法国夺冠推理链
  const rx = MARGIN + 7.5;
  addCard(s, rx, 1.7, W - rx - MARGIN, 3.5, C.cyan);
  s.addText("法国夺冠推理链", {
    x: rx + 0.3, y: 1.85, w: W - rx - MARGIN - 0.6, h: 0.4,
    fontSize: 16, fontFace: FONT_H, color: C.cyan, margin: 0
  });

  const path = [
    { stage: "R16", result: "已完成 ✓", color: C.green },
    { stage: "QF", result: "预测 3-0", color: C.cyan },
    { stage: "SF", result: "约 65%", color: C.gold },
    { stage: "决赛", result: "约 55%", color: C.gold },
    { stage: "夺冠", result: "约 60%", color: C.cyan },
  ];
  path.forEach((p, i) => {
    const py = 2.4 + i * 0.5;
    s.addShape(pres.shapes.OVAL, { x: rx + 0.3, y: py, w: 0.3, h: 0.3, fill: { color: p.color } });
    s.addText(p.stage, { x: rx + 0.3, y: py, w: 0.3, h: 0.3, fontSize: 8, fontFace: FONT_H, color: C.dark, align: "center", valign: "middle", margin: 0 });
    s.addText(p.result, { x: rx + 0.8, y: py, w: 3, h: 0.3, fontSize: 13, fontFace: FONT_B, color: C.text, valign: "middle", margin: 0 });
    if (i < 4) {
      s.addShape(pres.shapes.RECTANGLE, { x: rx + 0.43, y: py + 0.3, w: 0.04, h: 0.2, fill: { color: C.border } });
    }
  });

  s.addText("不是法国最强，是法国在每一步都「比较强」，概率乘起来最高。", {
    x: MARGIN, y: 5.5, w: W - 2 * MARGIN, h: 0.4,
    fontSize: 14, fontFace: FONT_B, color: C.text, align: "center", italic: true, margin: 0
  });

  addKeySentence(s, "法国 19.5% 排第一，因为它每一步都稳，不是某一步爆。");
  addPageNum(s, 16);
}

// ═══════════════════════════════════════════════════════════════
// P17 准确率证据：淘汰赛 88.9%
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "准确率证据：淘汰赛 88.9%", "Act IV · 结果有多准");

  // 四宫格
  const stats = [
    { label: "交叉验证", value: "78.99%", note: "5折", color: C.cyan, highlight: false },
    { label: "综合回测", value: "74.44%", note: "90场", color: C.green, highlight: false },
    { label: "小组赛", value: "70.83%", note: "72场", color: C.textMuted, highlight: false },
    { label: "淘汰赛", value: "88.89%", note: "18场对16场", color: C.gold, highlight: true },
  ];

  const gridW = (W - 2 * MARGIN - 0.4) / 2;
  const gridH = 1.6;
  stats.forEach((st, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const gx = MARGIN + col * (gridW + 0.4);
    const gy = 1.5 + row * (gridH + 0.3);

    s.addShape(pres.shapes.RECTANGLE, {
      x: gx, y: gy, w: gridW, h: gridH,
      fill: { color: C.panel },
      shadow: st.highlight ? { type: "outer", color: C.gold, blur: 12, offset: 0, angle: 0, opacity: 0.3 } : { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.2 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: gx, y: gy, w: 0.08, h: gridH, fill: { color: st.color }
    });

    s.addText(st.value, {
      x: gx + 0.3, y: gy + 0.15, w: gridW - 0.6, h: 0.8,
      fontSize: st.highlight ? 44 : 38, fontFace: FONT_H, color: st.color, margin: 0
    });
    s.addText([
      { text: st.label, options: { color: C.text, fontSize: 14, bold: true, breakLine: true } },
      { text: st.note, options: { color: C.textMuted, fontSize: 11 } },
    ], { x: gx + 0.3, y: gy + 1.0, w: gridW - 0.6, h: 0.5, fontFace: FONT_B, margin: 0 });
  });

  // 反差点
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 5.1, w: W - 2 * MARGIN, h: 0.7, fill: { color: C.dark }
  });
  s.addShape(pres.shapes.RECTANGLE, { x: MARGIN, y: 5.1, w: 0.06, h: 0.7, fill: { color: C.gold } });
  s.addText([
    { text: "反差点：", options: { bold: true, color: C.gold, fontSize: 13 } },
    { text: "淘汰赛反而比小组赛准 — 18 场猜对 16 场，因为淘汰赛有平局/加时/点球，模型的优势更明显。", options: { color: C.text, fontSize: 13 } },
  ], { x: MARGIN + 0.3, y: 5.1, w: W - 2 * MARGIN - 0.6, h: 0.7, fontFace: FONT_B, valign: "middle", margin: 0 });

  s.addText("90 场是独立验证集（已完赛结果作验证，非训练集泄漏）。", {
    x: MARGIN, y: 5.9, w: W - 2 * MARGIN, h: 0.3,
    fontSize: 12, fontFace: FONT_B, color: C.textMuted, align: "center", margin: 0
  });

  addKeySentence(s, "淘汰赛 18 场对 16 场，88.9%，越关键越准。");
  addPageNum(s, 17);
}

// ═══════════════════════════════════════════════════════════════
// P18 可解释性：Agent 会说人话
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "可解释性：Agent 会说人话", "Act IV · 结果有多准");

  // 左：比赛卡片
  addCard(s, MARGIN, 1.5, 6.5, 3.5, C.cyan);
  s.addText("法国 vs 摩洛哥", {
    x: MARGIN + 0.3, y: 1.65, w: 5.5, h: 0.4,
    fontSize: 18, fontFace: FONT_H, color: C.text, margin: 0
  });

  // 比分行
  s.addText("法国", { x: MARGIN + 0.3, y: 2.2, w: 1.5, h: 0.4, fontSize: 16, fontFace: FONT_H, color: C.cyan, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: MARGIN + 1.8, y: 2.2, w: 0.6, h: 0.4, fill: { color: C.cyan, transparency: 60 } });
  s.addText("3", { x: MARGIN + 1.8, y: 2.2, w: 0.6, h: 0.4, fontSize: 20, fontFace: FONT_H, color: C.cyan, align: "center", valign: "middle", margin: 0 });
  s.addText("85%", { x: MARGIN + 2.6, y: 2.2, w: 1, h: 0.4, fontSize: 14, fontFace: FONT_H, color: C.green, valign: "middle", margin: 0 });

  s.addText("摩洛哥", { x: MARGIN + 0.3, y: 2.7, w: 1.5, h: 0.4, fontSize: 16, fontFace: FONT_H, color: C.textMuted, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: MARGIN + 1.8, y: 2.7, w: 0.6, h: 0.4, fill: { color: C.panel2 } });
  s.addText("0", { x: MARGIN + 1.8, y: 2.7, w: 0.6, h: 0.4, fontSize: 20, fontFace: FONT_H, color: C.textMuted, align: "center", valign: "middle", margin: 0 });
  s.addText("5%", { x: MARGIN + 2.6, y: 2.7, w: 1, h: 0.4, fontSize: 14, fontFace: FONT_H, color: C.pink, valign: "middle", margin: 0 });

  // 关键因素
  s.addText("关键因素：", { x: MARGIN + 0.3, y: 3.3, w: 1.5, h: 0.3, fontSize: 11, fontFace: FONT_B, color: C.textMuted, margin: 0 });
  const factors = ["法国整体实力占优", "法国大赛底蕴更深", "摩洛哥近期状态更佳"];
  let fy = 3.6;
  factors.forEach(f => {
    const fw = 0.3 + f.length * 0.16;
    s.addShape(pres.shapes.RECTANGLE, { x: MARGIN + 0.3, y: fy, w: fw, h: 0.32, fill: { color: C.panel2 } });
    s.addText(f, { x: MARGIN + 0.3, y: fy, w: fw, h: 0.32, fontSize: 11, fontFace: FONT_B, color: C.cyan, align: "center", valign: "middle", margin: 0 });
    fy += 0.4;
  });

  // 右：射手榜
  addCard(s, MARGIN + 7.0, 1.5, W - MARGIN - 7.0, 3.5, C.gold);
  s.addText("射手榜 Top 3", {
    x: MARGIN + 7.3, y: 1.65, w: 4.5, h: 0.4,
    fontSize: 16, fontFace: FONT_H, color: C.gold, margin: 0
  });

  const scorers = [
    { rank: 1, player: "姆巴佩", team: "法国", exist: 7, pred: 9 },
    { rank: 2, player: "梅西", team: "阿根廷", exist: 7, pred: 8 },
    { rank: 3, player: "哈兰德", team: "挪威", exist: 5, pred: 6 },
  ];
  // 表头
  s.addText("#", { x: MARGIN + 7.3, y: 2.2, w: 0.4, h: 0.3, fontSize: 10, fontFace: FONT_B, color: C.textMuted, margin: 0 });
  s.addText("球员", { x: MARGIN + 7.8, y: 2.2, w: 1.5, h: 0.3, fontSize: 10, fontFace: FONT_B, color: C.textMuted, margin: 0 });
  s.addText("球队", { x: MARGIN + 9.3, y: 2.2, w: 1.2, h: 0.3, fontSize: 10, fontFace: FONT_B, color: C.textMuted, margin: 0 });
  s.addText("已进", { x: MARGIN + 10.5, y: 2.2, w: 0.8, h: 0.3, fontSize: 10, fontFace: FONT_B, color: C.textMuted, align: "center", margin: 0 });
  s.addText("预测", { x: MARGIN + 11.4, y: 2.2, w: 0.8, h: 0.3, fontSize: 10, fontFace: FONT_B, color: C.textMuted, align: "center", margin: 0 });

  scorers.forEach((sc, i) => {
    const sy = 2.6 + i * 0.55;
    if (i < 3) {
      s.addShape(pres.shapes.RECTANGLE, { x: MARGIN + 7.2, y: sy, w: W - MARGIN - 7.2, h: 0.5, fill: { color: C.gold, transparency: 85 } });
    }
    s.addText(`${sc.rank}`, { x: MARGIN + 7.3, y: sy, w: 0.4, h: 0.5, fontSize: 14, fontFace: FONT_H, color: C.gold, valign: "middle", margin: 0 });
    s.addText(sc.player, { x: MARGIN + 7.8, y: sy, w: 1.5, h: 0.5, fontSize: 14, fontFace: FONT_B, color: C.text, valign: "middle", margin: 0 });
    s.addText(sc.team, { x: MARGIN + 9.3, y: sy, w: 1.2, h: 0.5, fontSize: 12, fontFace: FONT_B, color: C.textMuted, valign: "middle", margin: 0 });
    s.addText(`${sc.exist}`, { x: MARGIN + 10.5, y: sy, w: 0.8, h: 0.5, fontSize: 14, fontFace: FONT_B, color: C.text, align: "center", valign: "middle", margin: 0 });
    s.addText(`${sc.pred}`, { x: MARGIN + 11.4, y: sy, w: 0.8, h: 0.5, fontSize: 16, fontFace: FONT_H, color: C.gold, align: "center", valign: "middle", margin: 0 });
  });

  s.addText("评委看不懂随机森林，但看得懂「法国实力占优」；这就是可解释性的意义。", {
    x: MARGIN, y: 5.3, w: W - 2 * MARGIN, h: 0.4,
    fontSize: 14, fontFace: FONT_B, color: C.text, align: "center", italic: true, margin: 0
  });

  addKeySentence(s, "它不只给概率，还告诉你凭什么。");
  addPageNum(s, 18);
}

// ═══════════════════════════════════════════════════════════════
// P19 项目价值：这证明了什么
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);
  addSlideTitle(s, "项目价值：这证明了什么", "尾声");

  const insights = [
    { title: "Agent ≠ 模型", desc: "是有边界的思考体\n会记忆、会谦逊", color: C.cyan },
    { title: "工程让重算变日常", desc: "预计算让 10000 次模拟\n成为 CI 里的日常操作", color: C.green },
    { title: "可解释是信任前提", desc: "不是附属功能\n是 Agent 被信任的门槛", color: C.gold },
  ];

  const colW = (W - 2 * MARGIN - 2 * 0.4) / 3;
  insights.forEach((ins, i) => {
    const ix = MARGIN + i * (colW + 0.4);
    addCard(s, ix, 1.7, colW, 2.8, ins.color);
    s.addText(ins.title, {
      x: ix + 0.3, y: 1.9, w: colW - 0.6, h: 0.5,
      fontSize: 16, fontFace: FONT_H, color: ins.color, margin: 0
    });
    s.addText(ins.desc, {
      x: ix + 0.3, y: 2.5, w: colW - 0.6, h: 1.5,
      fontSize: 14, fontFace: FONT_B, color: C.text, margin: 0
    });
  });

  // 公式横幅
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 4.9, w: W - 2 * MARGIN, h: 0.9, fill: { color: C.dark }
  });
  s.addText("预测类 Agent 的公式 =", {
    x: MARGIN + 0.3, y: 4.9, w: 3, h: 0.9,
    fontSize: 16, fontFace: FONT_B, color: C.text, valign: "middle", margin: 0
  });

  const formula = [
    { word: "记忆", color: C.cyan },
    { word: "想象", color: C.green },
    { word: "谦逊", color: C.gold },
    { word: "人话", color: C.pink },
    { word: "可验证", color: C.cyan },
  ];
  let fx = MARGIN + 3.3;
  formula.forEach((f, i) => {
    const fw = 0.3 + f.word.length * 0.25;
    s.addShape(pres.shapes.RECTANGLE, { x: fx, y: 5.15, w: fw, h: 0.4, fill: { color: C.panel } });
    s.addText(f.word, { x: fx, y: 5.15, w: fw, h: 0.4, fontSize: 14, fontFace: FONT_H, color: f.color, align: "center", valign: "middle", margin: 0 });
    fx += fw + 0.2;
    if (i < 4) {
      s.addText("+", { x: fx - 0.15, y: 5.15, w: 0.2, h: 0.4, fontSize: 14, color: C.textMuted, align: "center", valign: "middle", margin: 0 });
    }
  });

  addKeySentence(s, "这不只是预测世界杯，是一种造 Agent 的方法。");
  addPageNum(s, 19);
}

// ═══════════════════════════════════════════════════════════════
// P20 线上体验 + Q&A
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  darkBg(s);

  s.addText("线上体验 + Q&A", {
    x: MARGIN, y: 0.8, w: W - 2 * MARGIN, h: 0.7,
    fontSize: 32, fontFace: FONT_H, color: C.text, margin: 0
  });

  const halfW = (W - 2 * MARGIN - 0.5) / 2;

  // GitHub Pages（居中）
  const cardW2 = 7;
  const cardX = (W - cardW2) / 2;
  addCard(s, cardX, 2.0, cardW2, 2.5, C.cyan);
  s.addText("看", {
    x: cardX + 0.3, y: 2.2, w: 1, h: 0.5,
    fontSize: 28, fontFace: FONT_H, color: C.cyan, margin: 0
  });
  s.addText("GitHub Pages · 静态", {
    x: cardX + 1.3, y: 2.2, w: cardW2 - 1.6, h: 0.4,
    fontSize: 16, fontFace: FONT_H, color: C.text, margin: 0
  });
  s.addText("ainidbm.github.io/WorldCup-Prediction-mm-", {
    x: cardX + 0.3, y: 3.2, w: cardW2 - 0.6, h: 0.4,
    fontSize: 13, fontFace: FONT_B, color: C.green, margin: 0
  });
  s.addText("每日自动重算 · 零成本 · 零服务端", {
    x: cardX + 0.3, y: 3.7, w: cardW2 - 0.6, h: 0.3,
    fontSize: 12, fontFace: FONT_B, color: C.textMuted, margin: 0
  });

  // GitHub 仓库
  s.addText("GitHub 仓库：github.com/ainidbm/WorldCup-Prediction-mm-", {
    x: MARGIN, y: 4.8, w: W - 2 * MARGIN, h: 0.35,
    fontSize: 13, fontFace: FONT_B, color: C.textMuted, align: "center", margin: 0
  });

  // 致谢
  s.addShape(pres.shapes.RECTANGLE, {
    x: MARGIN, y: 5.5, w: W - 2 * MARGIN, h: 0.6, fill: { color: C.dark }
  });
  s.addShape(pres.shapes.RECTANGLE, { x: MARGIN, y: 5.5, w: 0.06, h: 0.6, fill: { color: C.gold } });
  s.addText("欢迎提问，特别是「你凭什么信」这类问题。", {
    x: MARGIN + 0.3, y: 5.5, w: W - 2 * MARGIN - 0.6, h: 0.6,
    fontSize: 15, fontFace: FONT_B, color: C.gold, italic: true, valign: "middle", margin: 0
  });

  s.addText("谢谢！", {
    x: MARGIN, y: 6.3, w: W - 2 * MARGIN, h: 0.5,
    fontSize: 24, fontFace: FONT_H, color: C.text, align: "center", margin: 0
  });

  addPageNum(s, 20);
}

// ═══════════════════════════════════════════════════════════════
// 保存
// ═══════════════════════════════════════════════════════════════
const OUT_PATH = "D:/World Cup championship prediction/ppt_workspace/世界杯冠军预测Agent_路演答辩.pptx";
const TMP_PATH = "D:/World Cup championship prediction/ppt_workspace/世界杯冠军预测Agent_路演答辩_fixed.pptx";

pres.writeFile({ fileName: TMP_PATH })
  .then(() => {
    const fs = require("fs");
    try {
      fs.copyFileSync(TMP_PATH, OUT_PATH);
      console.log("PPTX 生成成功并覆盖原文件！");
    } catch (e) {
      console.log("PPTX 已生成到:", TMP_PATH);
      console.log("原文件正被占用，无法覆盖。请关闭原文件后手动替换或直接使用 _fixed 版本。");
    }
  })
  .catch(err => console.error("生成失败:", err));
