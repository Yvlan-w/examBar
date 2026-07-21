// 预置题库数据（内存存储）

export interface SubjectData {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
  color: string;
}

export interface OptionData {
  label: string;
  content: string;
}

export interface QuestionData {
  id: string;
  content: string;
  type: 'choice' | 'judge' | 'short';
  options?: OptionData[];
  answer: string;
  analysis: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subjectId: string;
  subjectName: string;
}

export interface AnswerRecord {
  id: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  mode: string;
  subjectId: string;
  subjectName: string;
  createdAt: string;
}

export const subjects: SubjectData[] = [
  { id: 's1', name: '建设工程法规', icon: 'law', questionCount: 0, color: 'blue' },
  { id: 's2', name: '项目管理', icon: 'manage', questionCount: 0, color: 'emerald' },
  { id: 's3', name: '工程经济', icon: 'economy', questionCount: 0, color: 'amber' },
  { id: 's4', name: '建筑工程实务', icon: 'build', questionCount: 0, color: 'purple' },
  { id: 's5', name: '安全管理', icon: 'safety', questionCount: 0, color: 'rose' },
  { id: 's6', name: '质量管理', icon: 'quality', questionCount: 0, color: 'cyan' },
];

export const questions: QuestionData[] = [
  // 建设工程法规
  {
    id: 'q1', content: '根据《建筑法》，建筑工程开工前，建设单位应当按照国家有关规定向工程所在地县级以上人民政府建设行政主管部门申请领取（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '施工许可证' },
      { label: 'B', content: '规划许可证' },
      { label: 'C', content: '安全生产许可证' },
      { label: 'D', content: '营业执照' },
    ],
    answer: 'A', analysis: '根据《建筑法》第七条规定，建筑工程开工前，建设单位应当按照国家有关规定向工程所在地县级以上人民政府建设行政主管部门申请领取施工许可证。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规',
  },
  {
    id: 'q2', content: '建设工程竣工验收合格后，建设单位应当在规定的时间内将竣工验收报告报送建设行政主管部门备案。该期限为（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '15日' },
      { label: 'B', content: '30日' },
      { label: 'C', content: '45日' },
      { label: 'D', content: '60日' },
    ],
    answer: 'A', analysis: '根据《建设工程质量管理条例》第四十九条规定，建设单位应当自建设工程竣工验收合格之日起15日内，将建设工程竣工验收报告报送建设行政主管部门备案。',
    difficulty: 'medium', subjectId: 's1', subjectName: '建设工程法规',
  },
  {
    id: 'q3', content: '建筑施工企业应当依法为职工参加工伤保险缴纳工伤保险费，鼓励企业为从事危险作业的职工办理意外伤害保险。',
    type: 'judge',
    options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据《建筑法》第四十八条规定，建筑施工企业应当依法为职工参加工伤保险缴纳工伤保险费。鼓励企业为从事危险作业的职工办理意外伤害保险，支付保险费。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规',
  },
  {
    id: 'q4', content: '简述建筑工程施工许可证的申请条件。',
    type: 'short',
    answer: '建筑工程施工许可证申请条件包括：1.已经办理该建筑工程用地批准手续；2.在城市规划区的建筑工程，已经取得规划许可证；3.需要拆迁的，其拆迁进度符合施工要求；4.已经确定建筑施工企业；5.有满足施工需要的施工图纸及技术资料；6.有保证工程质量和安全的具体措施；7.建设资金已经落实；8.法律、行政法规规定的其他条件。',
    analysis: '施工许可证申请条件是《建筑法》第八条的核心内容，需要全面掌握各项条件。',
    difficulty: 'hard', subjectId: 's1', subjectName: '建设工程法规',
  },
  {
    id: 'q5', content: '根据《招标投标法》，下列关于投标保证金的说法，正确的是（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '投标保证金不得超过招标项目估算价的2%' },
      { label: 'B', content: '投标保证金不得超过投标报价的2%' },
      { label: 'C', content: '投标保证金最高不超过100万元' },
      { label: 'D', content: '投标保证金有效期应当与投标有效期一致' },
    ],
    answer: 'D', analysis: '根据《招标投标法实施条例》第二十六条规定，投标保证金有效期应当与投标有效期一致。投标保证金不得超过招标项目估算价的2%，最高不超过80万元人民币。',
    difficulty: 'medium', subjectId: 's1', subjectName: '建设工程法规',
  },
  // 项目管理
  {
    id: 'q6', content: '在项目管理中，WBS是指（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '工作分解结构' },
      { label: 'B', content: '项目进度计划' },
      { label: 'C', content: '项目成本预算' },
      { label: 'D', content: '项目质量控制' },
    ],
    answer: 'A', analysis: 'WBS（Work Breakdown Structure）即工作分解结构，是将项目可交付成果和项目工作分解成较小的、更易于管理的组件的过程。',
    difficulty: 'easy', subjectId: 's2', subjectName: '项目管理',
  },
  {
    id: 'q7', content: '关键路径法（CPM）中，关键路径是指项目网络图中（）的路径。',
    type: 'choice',
    options: [
      { label: 'A', content: '工期最长' },
      { label: 'B', content: '工期最短' },
      { label: 'C', content: '资源消耗最多' },
      { label: 'D', content: '风险最大' },
    ],
    answer: 'A', analysis: '关键路径是项目网络图中工期最长的路径，它决定了项目的最短完成时间。关键路径上的活动如果延误，将直接导致项目总工期延长。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理',
  },
  {
    id: 'q8', content: '项目管理中，范围蔓延是指项目范围未经控制地不断扩大。',
    type: 'judge',
    options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '范围蔓延（Scope Creep）确实是指项目范围在没有经过正式变更控制流程的情况下不断扩大，这通常会导致项目延期和超支。',
    difficulty: 'easy', subjectId: 's2', subjectName: '项目管理',
  },
  {
    id: 'q9', content: '简述项目管理中风险应对的主要策略。',
    type: 'short',
    answer: '风险应对策略主要包括：1.规避：改变项目计划以消除风险；2.转移：将风险的影响转移给第三方（如购买保险）；3.减轻：降低风险发生的概率或影响；4.接受：承担风险带来的后果，分为主动接受和被动接受。对于负面风险采用以上策略，对于正面风险（机会）则采用开拓、分享、提高和接受策略。',
    analysis: '风险应对策略是项目管理的重要知识点，需要区分负面风险和正面风险的不同应对方式。',
    difficulty: 'hard', subjectId: 's2', subjectName: '项目管理',
  },
  {
    id: 'q10', content: '在项目进度管理中，甘特图的主要缺点是（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '不能直观显示各活动的起止时间' },
      { label: 'B', content: '不能清楚地表示活动之间的依赖关系' },
      { label: 'C', content: '不能用于大型项目' },
      { label: 'D', content: '不能显示项目进度' },
    ],
    answer: 'B', analysis: '甘特图虽然直观显示各活动的时间安排，但其主要缺点是不能清楚地表示活动之间的逻辑依赖关系，也不容易确定关键路径。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理',
  },
  // 工程经济
  {
    id: 'q11', content: '资金时间价值的本质是（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '资金具有增值能力' },
      { label: 'B', content: '通货膨胀导致货币贬值' },
      { label: 'C', content: '资金用于投资可以产生收益' },
      { label: 'D', content: '以上都是' },
    ],
    answer: 'C', analysis: '资金时间价值的本质是资金用于投资（生产经营过程）可以产生收益，即资金在周转使用中由于利润的产生而增值。',
    difficulty: 'medium', subjectId: 's3', subjectName: '工程经济',
  },
  {
    id: 'q12', content: '净现值（NPV）大于零，说明该投资方案在经济上是可行的。',
    type: 'judge',
    options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '净现值NPV>0说明该方案的收益率超过了基准收益率，在经济上是可行的。NPV=0说明刚好达到基准收益率，NPV<0则不可行。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济',
  },
  {
    id: 'q13', content: '某建设项目建设投资为1000万元，建设期利息为100万元，流动资金为200万元，则该项目的总投资为（）万元。',
    type: 'choice',
    options: [
      { label: 'A', content: '1000' },
      { label: 'B', content: '1100' },
      { label: 'C', content: '1200' },
      { label: 'D', content: '1300' },
    ],
    answer: 'D', analysis: '建设项目总投资 = 建设投资 + 建设期利息 + 流动资金 = 1000 + 100 + 200 = 1300万元。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济',
  },
  {
    id: 'q14', content: '简述工程经济评价中静态评价指标和动态评价指标的区别。',
    type: 'short',
    answer: '静态评价指标不考虑资金时间价值，如静态投资回收期、投资收益率等，计算简便但精度较低。动态评价指标考虑资金时间价值，如净现值（NPV）、内部收益率（IRR）、动态投资回收期等，更加准确地反映项目的经济效益。实际工程中，通常以动态指标为主，静态指标为辅。',
    analysis: '理解静态和动态指标的核心区别在于是否考虑资金时间价值。',
    difficulty: 'hard', subjectId: 's3', subjectName: '工程经济',
  },
  {
    id: 'q15', content: '设备租赁与购买方案比选中，通常采用的分析方法是（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '净现值法' },
      { label: 'B', content: '增量投资收益率法' },
      { label: 'C', content: '年费用法' },
      { label: 'D', content: '内部收益率法' },
    ],
    answer: 'C', analysis: '设备租赁与购买方案比选通常采用年费用法，因为两种方案的服务期限通常相同，通过比较年费用大小来选择较优方案。',
    difficulty: 'medium', subjectId: 's3', subjectName: '工程经济',
  },
  // 建筑工程实务
  {
    id: 'q16', content: '混凝土强度等级C30中的30表示（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '抗压强度标准值为30MPa' },
      { label: 'B', content: '抗拉强度标准值为30MPa' },
      { label: 'C', content: '抗压强度设计值为30MPa' },
      { label: 'D', content: '抗折强度标准值为30MPa' },
    ],
    answer: 'A', analysis: '混凝土强度等级C30中的30表示立方体抗压强度标准值为30MPa，即按标准方法制作和养护的边长为150mm的立方体试件，在28天龄期用标准试验方法测得的具有95%保证率的抗压强度值。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务',
  },
  {
    id: 'q17', content: '钢筋混凝土地梁的主要作用是承受上部墙体传来的荷载并传递给基础。',
    type: 'judge',
    options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '地梁（基础梁）的主要作用确实是承受上部墙体传来的荷载，并将其均匀传递给基础，同时还有增强基础整体性的作用。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务',
  },
  {
    id: 'q18', content: '下列关于模板拆除顺序的说法，正确的是（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '先支的先拆，后支的后拆' },
      { label: 'B', content: '先支的后拆，后支的先拆' },
      { label: 'C', content: '同时拆除' },
      { label: 'D', content: '随意拆除' },
    ],
    answer: 'B', analysis: '模板拆除应遵循"先支的后拆，后支的先拆"的原则，即先拆除非承重模板，后拆除承重模板，确保结构安全。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务',
  },
  {
    id: 'q19', content: '简述混凝土浇筑的基本要求。',
    type: 'short',
    answer: '混凝土浇筑的基本要求：1.浇筑前应检查模板、钢筋、预埋件等是否符合要求；2.混凝土应分层浇筑，每层厚度不超过振捣棒作用长度的1.25倍；3.浇筑应连续进行，如需间歇，间歇时间不应超过混凝土初凝时间；4.混凝土自由下落高度不应超过2m，超过时应采用串筒、溜管等措施；5.振捣应密实，不得漏振、过振；6.浇筑完毕后应及时养护。',
    analysis: '混凝土浇筑是施工中的关键工序，需要掌握各项技术要求。',
    difficulty: 'hard', subjectId: 's4', subjectName: '建筑工程实务',
  },
  {
    id: 'q20', content: '大体积混凝土施工时，为控制温度裂缝，应采取的措施不包括（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '选用低水化热水泥' },
      { label: 'B', content: '掺加粉煤灰等掺合料' },
      { label: 'C', content: '加快浇筑速度，缩短浇筑时间' },
      { label: 'D', content: '埋设冷却水管进行降温' },
    ],
    answer: 'C', analysis: '大体积混凝土温控措施包括：选用低水化热水泥、掺加粉煤灰减少水泥用量、埋设冷却水管、表面保温养护等。加快浇筑速度不利于散热，反而可能增加温度应力。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务',
  },
  // 安全管理
  {
    id: 'q21', content: '建筑施工企业安全生产许可证的有效期为（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '1年' },
      { label: 'B', content: '2年' },
      { label: 'C', content: '3年' },
      { label: 'D', content: '5年' },
    ],
    answer: 'C', analysis: '根据《安全生产许可证条例》规定，安全生产许可证的有效期为3年。有效期满需要延期的，应当于期满前3个月向原发证机关办理延期手续。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理',
  },
  {
    id: 'q22', content: '高处作业是指在坠落高度基准面（）m及以上有可能坠落的高处进行的作业。',
    type: 'choice',
    options: [
      { label: 'A', content: '1.5' },
      { label: 'B', content: '2' },
      { label: 'C', content: '2.5' },
      { label: 'D', content: '3' },
    ],
    answer: 'B', analysis: '根据国家标准GB/T 3608-2008《高处作业分级》规定，高处作业是指在坠落高度基准面2m及以上有可能坠落的高处进行的作业。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理',
  },
  {
    id: 'q23', content: '施工现场的"三宝"是指安全帽、安全带和安全网。',
    type: 'judge',
    options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '施工现场"三宝"确实是指安全帽、安全带和安全网，这是建筑施工中最基本的安全防护用品。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理',
  },
  {
    id: 'q24', content: '简述施工现场安全检查的主要内容。',
    type: 'short',
    answer: '施工现场安全检查的主要内容包括：1.安全生产责任制落实情况；2.施工组织设计及专项方案的编制审批情况；3.安全技术交底情况；4.安全教育培训情况；5.安全防护设施（临边洞口防护、脚手架、模板支撑等）；6.施工用电安全；7.起重机械及垂直运输设备安全；8.消防安全；9.文明施工；10.劳动防护用品使用情况。',
    analysis: '安全检查是预防事故的重要手段，需要全面覆盖各个方面。',
    difficulty: 'hard', subjectId: 's5', subjectName: '安全管理',
  },
  {
    id: 'q25', content: '基坑开挖深度超过（）时，应编制专项施工方案。',
    type: 'choice',
    options: [
      { label: 'A', content: '2m' },
      { label: 'B', content: '3m' },
      { label: 'C', content: '5m' },
      { label: 'D', content: '8m' },
    ],
    answer: 'B', analysis: '根据住建部相关规定，基坑开挖深度超过3m（含3m）或虽未超过3m但地质条件和周边环境复杂的基坑支护工程，需要编制专项施工方案。',
    difficulty: 'medium', subjectId: 's5', subjectName: '安全管理',
  },
  // 质量管理
  {
    id: 'q26', content: 'PDCA循环中的D代表（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '设计（Design）' },
      { label: 'B', content: '执行（Do）' },
      { label: 'C', content: '检查（Detect）' },
      { label: 'D', content: '交付（Deliver）' },
    ],
    answer: 'B', analysis: 'PDCA循环中，P=Plan（计划）、D=Do（执行）、C=Check（检查）、A=Act（处理），是质量管理的基本工作方法。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理',
  },
  {
    id: 'q27', content: '工程质量事故按严重程度分为一般事故和重大事故两个等级。',
    type: 'judge',
    options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '工程质量事故按严重程度分为四个等级：特别重大事故、重大事故、较大事故和一般事故。',
    difficulty: 'medium', subjectId: 's6', subjectName: '质量管理',
  },
  {
    id: 'q28', content: '混凝土结构实体检验中，回弹法属于（）。',
    type: 'choice',
    options: [
      { label: 'A', content: '破损检测方法' },
      { label: 'B', content: '非破损检测方法' },
      { label: 'C', content: '半破损检测方法' },
      { label: 'D', content: '取样检测方法' },
    ],
    answer: 'B', analysis: '回弹法是一种非破损检测方法，通过测量混凝土表面的回弹值来推定混凝土的抗压强度，不会对结构造成损伤。',
    difficulty: 'medium', subjectId: 's6', subjectName: '质量管理',
  },
  {
    id: 'q29', content: '简述建筑工程质量验收的层次划分。',
    type: 'short',
    answer: '建筑工程质量验收分为四个层次：1.检验批：按同一生产条件或规定方式汇总起来的由一定数量样本组成的检验体；2.分项工程：按主要工种、材料、施工工艺等划分；3.分部工程：按专业性质、建筑部位确定；4.单位工程：具备独立施工条件并能形成独立使用功能的建筑物或构筑物。验收顺序为：检验批→分项工程→分部工程→单位工程。',
    analysis: '质量验收层次是工程质量管理的核心知识点。',
    difficulty: 'hard', subjectId: 's6', subjectName: '质量管理',
  },
  {
    id: 'q30', content: '隐蔽工程在隐蔽前，应由（）通知有关单位进行验收。',
    type: 'choice',
    options: [
      { label: 'A', content: '建设单位' },
      { label: 'B', content: '施工单位' },
      { label: 'C', content: '监理单位' },
      { label: 'D', content: '设计单位' },
    ],
    answer: 'B', analysis: '根据相关规定，隐蔽工程在隐蔽前，施工单位应通知监理单位（建设单位）进行验收，并形成验收文件，验收合格后方可进行下一道工序施工。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理',
  },
];

// Update subject question counts
subjects.forEach((subject) => {
  subject.questionCount = questions.filter((q) => q.subjectId === subject.id).length;
});

// Answer records storage
export const answerRecords: AnswerRecord[] = [];
