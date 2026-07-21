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
  year?: number;
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

export interface FavoriteRecord {
  id: string;
  questionId: string;
  createdAt: string;
}

export const subjects: SubjectData[] = [
  { id: 's1', name: '证券基础知识', icon: 'stock', questionCount: 0, color: 'blue' },
  { id: 's2', name: '投资银行业务', icon: 'investment', questionCount: 0, color: 'emerald' },
  { id: 's3', name: '基金从业知识', icon: 'fund', questionCount: 0, color: 'amber' },
  { id: 's4', name: '风险管理', icon: 'risk', questionCount: 0, color: 'purple' },
  { id: 's5', name: '金融市场基础', icon: 'market', questionCount: 0, color: 'rose' },
  { id: 's6', name: '商业银行管理', icon: 'bank', questionCount: 0, color: 'cyan' },
];

export const questions: QuestionData[] = [
  // 证券基础知识 - 选择题
  {
    id: 'q1', content: '股票是股份公司发行的代表（）的有价证券。',
    type: 'choice', options: [
      { label: 'A', content: '债权' },
      { label: 'B', content: '所有权' },
      { label: 'C', content: '使用权' },
      { label: 'D', content: '租赁权' },
    ],
    answer: 'B', analysis: '股票是股份公司发行的代表公司所有权的有价证券，持有者作为公司股东享有相应的权利和义务。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2023,
  },
  {
    id: 'q2', content: '下列属于资本市场工具的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '短期国债' },
      { label: 'B', content: '回购协议' },
      { label: 'C', content: '股票' },
      { label: 'D', content: '大额可转让存单' },
    ],
    answer: 'C', analysis: '资本市场是指期限在一年以上的金融市场，主要工具包括股票、债券、基金等。短期国债、回购协议、大额可转让存单属于货币市场工具。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2022,
  },
  {
    id: 'q3', content: 'ETF的中文全称是（）。',
    type: 'choice', options: [
      { label: 'A', content: '交易型开放式指数基金' },
      { label: 'B', content: '交易所交易基金' },
      { label: 'C', content: '指数型基金' },
      { label: 'D', content: '开放式基金' },
    ],
    answer: 'A', analysis: 'ETF（Exchange Traded Fund）中文全称为交易型开放式指数基金，是一种在交易所上市交易的开放式指数基金。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2023,
  },
  {
    id: 'q4', content: '债券的票面利率是指（）。',
    type: 'choice', options: [
      { label: 'A', content: '债券发行人支付给投资者的利息率' },
      { label: 'B', content: '债券的市场利率' },
      { label: 'C', content: '债券的到期收益率' },
      { label: 'D', content: '债券的贴现率' },
    ],
    answer: 'A', analysis: '票面利率是债券发行人在债券上标明的利率，是发行人支付给投资者的利息率，通常以年率表示。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2022,
  },
  {
    id: 'q5', content: '下列关于普通股和优先股的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '优先股股东享有优先投票权' },
      { label: 'B', content: '普通股股东享有优先分红权' },
      { label: 'C', content: '优先股股东享有优先分配剩余财产权' },
      { label: 'D', content: '普通股股东不承担公司亏损' },
    ],
    answer: 'C', analysis: '优先股股东在公司清算时享有优先分配剩余财产的权利，但通常没有投票权。普通股股东享有投票权，但在分红和剩余财产分配上排在优先股之后。',
    difficulty: 'medium', subjectId: 's1', subjectName: '证券基础知识', year: 2024,
  },
  {
    id: 'q6', content: '市盈率（P/E）是指（）。',
    type: 'choice', options: [
      { label: 'A', content: '每股收益除以股价' },
      { label: 'B', content: '股价除以每股收益' },
      { label: 'C', content: '每股净资产除以股价' },
      { label: 'D', content: '股价除以每股净资产' },
    ],
    answer: 'B', analysis: '市盈率（Price-to-Earnings Ratio）= 股价 / 每股收益，是衡量股票估值水平的重要指标。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2021,
  },
  {
    id: 'q7', content: '下列属于系统性风险的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '公司经营风险' },
      { label: 'B', content: '利率风险' },
      { label: 'C', content: '财务风险' },
      { label: 'D', content: '信用风险' },
    ],
    answer: 'B', analysis: '系统性风险是指影响整个市场的风险，如利率风险、汇率风险、通货膨胀风险等。公司经营风险、财务风险、信用风险属于非系统性风险，可以通过分散投资降低。',
    difficulty: 'medium', subjectId: 's1', subjectName: '证券基础知识', year: 2023,
  },
  {
    id: 'q8', content: '证券投资基金的托管人通常是（）。',
    type: 'choice', options: [
      { label: 'A', content: '基金管理公司' },
      { label: 'B', content: '商业银行' },
      { label: 'C', content: '证券公司' },
      { label: 'D', content: '保险公司' },
    ],
    answer: 'B', analysis: '基金托管人是负责保管基金资产、监督基金管理人的机构，通常由商业银行担任。基金管理公司是基金管理人。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2024,
  },
  {
    id: 'q9', content: '下列关于可转换债券的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '可转换债券可以转换为股票' },
      { label: 'B', content: '可转换债券兼具债券和股票的特性' },
      { label: 'C', content: '可转换债券的票面利率通常高于普通债券' },
      { label: 'D', content: '可转换债券有转换期限' },
    ],
    answer: 'C', analysis: '可转换债券的票面利率通常低于普通债券，因为其具有转换为股票的期权价值。',
    difficulty: 'medium', subjectId: 's1', subjectName: '证券基础知识', year: 2022,
  },
  {
    id: 'q10', content: '股票的账面价值是指（）。',
    type: 'choice', options: [
      { label: 'A', content: '股票的市场价格' },
      { label: 'B', content: '每股净资产' },
      { label: 'C', content: '每股收益' },
      { label: 'D', content: '股票的票面价值' },
    ],
    answer: 'B', analysis: '股票的账面价值即每股净资产，等于公司净资产除以发行在外的普通股股数。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2021,
  },
  // 证券基础知识 - 判断题
  {
    id: 'q11', content: '股票的市场价格主要由公司的盈利能力决定。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '股票的市场价格本质上反映了投资者对公司未来盈利能力的预期，公司盈利能力是决定股票价值的核心因素。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2023,
  },
  {
    id: 'q12', content: '债券的价格与市场利率呈反向变动关系。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '债券价格与市场利率呈反向变动：市场利率上升时，债券价格下降；市场利率下降时，债券价格上升。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2022,
  },
  {
    id: 'q13', content: '封闭式基金的份额可以随时赎回。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '封闭式基金的份额在封闭期内不能赎回，只能在交易所上市交易。开放式基金的份额可以随时赎回。',
    difficulty: 'medium', subjectId: 's1', subjectName: '证券基础知识', year: 2024,
  },
  {
    id: 'q14', content: '系统性风险可以通过分散投资来消除。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '系统性风险是影响整个市场的风险，无法通过分散投资消除。非系统性风险才可以通过分散投资降低。',
    difficulty: 'easy', subjectId: 's1', subjectName: '证券基础知识', year: 2021,
  },
  // 证券基础知识 - 简答题
  {
    id: 'q15', content: '简述股票与债券的主要区别。',
    type: 'short',
    answer: '股票与债券的主要区别包括：1.性质不同：股票代表所有权，债券代表债权；2.收益方式不同：股票收益包括股息和资本利得，债券收益主要是利息；3.风险不同：股票风险较高，债券风险较低；4.期限不同：股票无到期日，债券有固定期限；5.参与权不同：股东享有公司决策权，债权人不参与公司决策；6.清偿顺序不同：公司清算时，债券持有人优先于股东受偿。',
    analysis: '理解股票与债券的区别是证券基础知识的核心内容。',
    difficulty: 'hard', subjectId: 's1', subjectName: '证券基础知识', year: 2023,
  },
  {
    id: 'q16', content: '简述证券投资基金的特点。',
    type: 'short',
    answer: '证券投资基金的特点包括：1.集合理财：汇集众多投资者的资金进行投资；2.专业管理：由专业基金管理人进行投资决策；3.分散风险：通过投资多种证券分散风险；4.流动性强：开放式基金可随时赎回，封闭式基金可在交易所交易；5.透明度高：定期披露基金净值和投资组合；6.费用较低：相比个人投资者，基金规模效应降低了交易成本。',
    analysis: '掌握证券投资基金的特点有助于理解其运作机制。',
    difficulty: 'hard', subjectId: 's1', subjectName: '证券基础知识', year: 2024,
  },

  // 投资银行业务 - 选择题
  {
    id: 'q17', content: '首次公开发行股票（IPO）的承销方式不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '全额包销' },
      { label: 'B', content: '余额包销' },
      { label: 'C', content: '代销' },
      { label: 'D', content: '回购' },
    ],
    answer: 'D', analysis: 'IPO承销方式主要包括全额包销、余额包销和代销。回购是一种融资交易方式，不属于承销方式。',
    difficulty: 'easy', subjectId: 's2', subjectName: '投资银行业务', year: 2023,
  },
  {
    id: 'q18', content: '下列关于保荐制度的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '保荐机构不需要承担持续督导责任' },
      { label: 'B', content: '保荐代表人不需要具备从业资格' },
      { label: 'C', content: '保荐机构对发行人的信息披露承担连带责任' },
      { label: 'D', content: '保荐制度只适用于股票发行' },
    ],
    answer: 'C', analysis: '保荐机构对发行人的信息披露真实性、准确性和完整性承担连带责任，并在上市后承担持续督导责任。',
    difficulty: 'medium', subjectId: 's2', subjectName: '投资银行业务', year: 2022,
  },
  {
    id: 'q19', content: '上市公司发行可转换公司债券的转股价格应不低于（）。',
    type: 'choice', options: [
      { label: 'A', content: '募集说明书公告日前20个交易日公司股票均价' },
      { label: 'B', content: '募集说明书公告日前10个交易日公司股票均价' },
      { label: 'C', content: '募集说明书公告日前5个交易日公司股票均价' },
      { label: 'D', content: '发行前一日公司股票收盘价' },
    ],
    answer: 'A', analysis: '可转换公司债券的转股价格应不低于募集说明书公告日前20个交易日公司股票均价和前1个交易日均价。',
    difficulty: 'medium', subjectId: 's2', subjectName: '投资银行业务', year: 2024,
  },
  {
    id: 'q20', content: '下列属于投资银行核心业务的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '吸收存款' },
      { label: 'B', content: '发放贷款' },
      { label: 'C', content: '证券承销' },
      { label: 'D', content: '办理支付结算' },
    ],
    answer: 'C', analysis: '投资银行的核心业务包括证券承销、并购重组、资产管理、证券交易等。吸收存款、发放贷款、支付结算是商业银行的主要业务。',
    difficulty: 'easy', subjectId: 's2', subjectName: '投资银行业务', year: 2023,
  },
  {
    id: 'q21', content: '上市公司重大资产重组的标准之一是购买、出售的资产净额占上市公司最近一个会计年度经审计的合并财务会计报告期末净资产额的比例达到（）以上。',
    type: 'choice', options: [
      { label: 'A', content: '30%' },
      { label: 'B', content: '50%' },
      { label: 'C', content: '70%' },
      { label: 'D', content: '100%' },
    ],
    answer: 'B', analysis: '根据相关规定，重大资产重组的标准之一是购买、出售的资产净额占上市公司最近一个会计年度经审计的合并财务会计报告期末净资产额的比例达到50%以上。',
    difficulty: 'medium', subjectId: 's2', subjectName: '投资银行业务', year: 2022,
  },
  {
    id: 'q22', content: '下列关于配股的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '配股是向原股东配售股份' },
      { label: 'B', content: '配股价格通常低于市场价格' },
      { label: 'C', content: '配股不需要履行信息披露义务' },
      { label: 'D', content: '配股需要股东大会审议通过' },
    ],
    answer: 'C', analysis: '配股属于上市公司再融资行为，需要履行严格的信息披露义务，包括发布配股说明书等文件。',
    difficulty: 'hard', subjectId: 's2', subjectName: '投资银行业务', year: 2024,
  },
  {
    id: 'q23', content: '投资银行在并购重组中的角色不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '担任财务顾问' },
      { label: 'B', content: '提供融资支持' },
      { label: 'C', content: '进行尽职调查' },
      { label: 'D', content: '直接经营目标公司' },
    ],
    answer: 'D', analysis: '投资银行在并购重组中通常担任财务顾问、提供融资支持、进行尽职调查等角色，但不会直接经营目标公司。',
    difficulty: 'medium', subjectId: 's2', subjectName: '投资银行业务', year: 2023,
  },
  {
    id: 'q24', content: '下列关于非公开发行股票的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '非公开发行股票的对象可以是任意投资者' },
      { label: 'B', content: '非公开发行股票不需要审批' },
      { label: 'C', content: '非公开发行股票的发行价格不得低于定价基准日前20个交易日均价的80%' },
      { label: 'D', content: '非公开发行股票没有锁定期' },
    ],
    answer: 'C', analysis: '非公开发行股票的发行价格不得低于定价基准日前20个交易日公司股票均价的80%，发行对象有特定限制，且有锁定期要求。',
    difficulty: 'easy', subjectId: 's2', subjectName: '投资银行业务', year: 2021,
  },
  {
    id: 'q25', content: '下列关于证券公司承销业务的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '证券公司可以同时承销自己发行的证券' },
      { label: 'B', content: '证券公司承销证券应当对公开发行募集文件的真实性、准确性、完整性进行核查' },
      { label: 'C', content: '证券公司不需要与发行人签订承销协议' },
      { label: 'D', content: '证券公司承销证券可以自行决定发行价格' },
    ],
    answer: 'B', analysis: '证券公司承销证券，应当对公开发行募集文件的真实性、准确性、完整性进行核查；发现有虚假记载、误导性陈述或者重大遗漏的，不得进行销售活动。',
    difficulty: 'medium', subjectId: 's2', subjectName: '投资银行业务', year: 2024,
  },
  {
    id: 'q26', content: '上市公司公开发行证券的条件不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '具备健全且运行良好的组织机构' },
      { label: 'B', content: '具有持续盈利能力' },
      { label: 'C', content: '最近3年财务会计文件无虚假记载' },
      { label: 'D', content: '公司成立时间不少于1年' },
    ],
    answer: 'D', analysis: '上市公司公开发行证券的条件包括：具备健全且运行良好的组织机构、具有持续盈利能力、最近3年财务会计文件无虚假记载等。对公司成立时间没有1年的限制。',
    difficulty: 'easy', subjectId: 's2', subjectName: '投资银行业务', year: 2022,
  },
  // 投资银行业务 - 判断题
  {
    id: 'q27', content: '投资银行可以同时从事证券自营和证券承销业务。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '证券公司可以同时从事证券自营和证券承销业务，但需要建立防火墙制度，防范利益冲突。',
    difficulty: 'easy', subjectId: 's2', subjectName: '投资银行业务', year: 2023,
  },
  {
    id: 'q28', content: '上市公司发行股份购买资产的发行价格不得低于市场参考价的90%。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据相关规定，上市公司发行股份购买资产的发行价格不得低于市场参考价的90%，市场参考价为本次发行股份购买资产的董事会决议公告日前20个交易日、60个交易日或者120个交易日的公司股票交易均价之一。',
    difficulty: 'medium', subjectId: 's2', subjectName: '投资银行业务', year: 2024,
  },
  {
    id: 'q29', content: '投资银行的核心功能是资金中介。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '投资银行的核心功能是资本市场中介，包括证券发行、交易、并购重组等，而非简单的资金中介。商业银行的核心功能才是资金中介。',
    difficulty: 'medium', subjectId: 's2', subjectName: '投资银行业务', year: 2022,
  },
  {
    id: 'q30', content: '上市公司非公开发行股票的发行对象不得超过35名。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据相关规定，上市公司非公开发行股票的发行对象不得超过35名，发行对象为境外战略投资者的，应当经国务院相关部门事先批准。',
    difficulty: 'easy', subjectId: 's2', subjectName: '投资银行业务', year: 2023,
  },
  // 投资银行业务 - 简答题
  {
    id: 'q31', content: '简述投资银行的主要业务类型。',
    type: 'short',
    answer: '投资银行的主要业务包括：1.证券承销与保荐：协助企业发行股票、债券等证券；2.并购重组：为企业并购、重组提供财务顾问服务；3.证券交易：从事证券经纪和自营交易；4.资产管理：管理各类投资基金和客户资产；5.研究咨询：提供证券研究报告和投资咨询服务；6.衍生品业务：从事金融衍生品的交易和发行；7.私募股权：投资未上市企业股权。',
    analysis: '了解投资银行的业务范围是投资银行业务的基础知识点。',
    difficulty: 'hard', subjectId: 's2', subjectName: '投资银行业务', year: 2023,
  },
  {
    id: 'q32', content: '简述上市公司重大资产重组的审核程序。',
    type: 'short',
    answer: '上市公司重大资产重组的审核程序包括：1.董事会决议：上市公司董事会作出重大资产重组决议；2.股东大会审议：提交股东大会审议通过；3.申报材料：向证监会提交申请文件；4.受理审查：证监会受理并进行初审；5.反馈意见：证监会出具反馈意见，上市公司补充披露；6.并购重组委审核：提交并购重组委审核；7.核准批复：审核通过后出具核准批复；8.实施完成：办理资产交割和股份发行。',
    analysis: '掌握重大资产重组的审核流程对于理解资本市场运作至关重要。',
    difficulty: 'hard', subjectId: 's2', subjectName: '投资银行业务', year: 2024,
  },

  // 基金从业知识 - 选择题
  {
    id: 'q33', content: '证券投资基金的特点不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '集合理财' },
      { label: 'B', content: '专业管理' },
      { label: 'C', content: '高风险高收益' },
      { label: 'D', content: '分散风险' },
    ],
    answer: 'C', analysis: '证券投资基金的特点包括集合理财、专业管理、分散风险、流动性强、透明度高等。高风险高收益不是基金的普遍特点，不同类型基金风险收益特征不同。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2023,
  },
  {
    id: 'q34', content: '下列关于开放式基金的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '开放式基金的份额固定不变' },
      { label: 'B', content: '开放式基金的份额可以随时申购赎回' },
      { label: 'C', content: '开放式基金只能在交易所交易' },
      { label: 'D', content: '开放式基金的价格由市场供求决定' },
    ],
    answer: 'B', analysis: '开放式基金的份额不固定，可以随时向基金管理人申购或赎回，其价格以基金净值为准。封闭式基金份额固定，在交易所交易，价格由市场供求决定。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2022,
  },
  {
    id: 'q35', content: '基金管理人的主要职责是（）。',
    type: 'choice', options: [
      { label: 'A', content: '保管基金资产' },
      { label: 'B', content: '负责基金投资运作' },
      { label: 'C', content: '监督基金管理人' },
      { label: 'D', content: '销售基金份额' },
    ],
    answer: 'B', analysis: '基金管理人负责基金的投资决策和日常运作，基金托管人负责保管基金资产并监督基金管理人，基金销售机构负责销售基金份额。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2024,
  },
  {
    id: 'q36', content: '下列属于货币市场基金投资范围的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '股票' },
      { label: 'B', content: '长期债券' },
      { label: 'C', content: '短期国债' },
      { label: 'D', content: '可转债' },
    ],
    answer: 'C', analysis: '货币市场基金主要投资于短期货币工具，如短期国债、银行存款、同业存单、回购协议等。股票、长期债券、可转债不属于货币市场工具。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2023,
  },
  {
    id: 'q37', content: '基金份额净值是指（）。',
    type: 'choice', options: [
      { label: 'A', content: '基金总资产' },
      { label: 'B', content: '基金总负债' },
      { label: 'C', content: '基金总资产除以基金总份额' },
      { label: 'D', content: '基金总份额除以基金总资产' },
    ],
    answer: 'C', analysis: '基金份额净值 = 基金总资产 / 基金总份额，是基金申购赎回的价格依据。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2022,
  },
  {
    id: 'q38', content: '下列关于ETF的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: 'ETF可以在交易所上市交易' },
      { label: 'B', content: 'ETF只能被动跟踪指数' },
      { label: 'C', content: 'ETF可以进行实物申购赎回' },
      { label: 'D', content: 'ETF兼具开放式和封闭式基金的特点' },
    ],
    answer: 'B', analysis: 'ETF通常是被动跟踪指数的，但也有主动管理型ETF。ETF可以在交易所上市交易，可以进行实物申购赎回，兼具开放式和封闭式基金的特点。',
    difficulty: 'medium', subjectId: 's3', subjectName: '基金从业知识', year: 2024,
  },
  {
    id: 'q39', content: '基金销售的适当性原则要求（）。',
    type: 'choice', options: [
      { label: 'A', content: '将高风险产品推荐给所有客户' },
      { label: 'B', content: '将合适的产品推荐给合适的投资者' },
      { label: 'C', content: '只推荐低风险产品' },
      { label: 'D', content: '不考虑客户风险承受能力' },
    ],
    answer: 'B', analysis: '基金销售的适当性原则要求基金销售机构在销售基金时，了解客户的风险承受能力，将合适的产品推荐给合适的投资者。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2023,
  },
  {
    id: 'q40', content: '下列关于基金定投的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '定投一定能赚钱' },
      { label: 'B', content: '定投可以摊平成本' },
      { label: 'C', content: '定投不需要考虑市场时机' },
      { label: 'D', content: '定投金额必须固定不变' },
    ],
    answer: 'B', analysis: '基金定投通过定期定额投资，可以在市场下跌时买入更多份额，上涨时买入较少份额，从而摊平持仓成本，降低择时风险。但定投并不能保证一定赚钱，仍需考虑市场风险。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2021,
  },
  {
    id: 'q41', content: '基金的运作费用不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '管理费' },
      { label: 'B', content: '托管费' },
      { label: 'C', content: '申购费' },
      { label: 'D', content: '销售服务费' },
    ],
    answer: 'C', analysis: '基金运作费用包括管理费、托管费、销售服务费等。申购费属于销售费用，不属于运作费用。',
    difficulty: 'medium', subjectId: 's3', subjectName: '基金从业知识', year: 2024,
  },
  {
    id: 'q42', content: '下列关于FOF的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: 'FOF直接投资于股票' },
      { label: 'B', content: 'FOF投资于其他基金' },
      { label: 'C', content: 'FOF不需要基金经理' },
      { label: 'D', content: 'FOF风险与股票基金相同' },
    ],
    answer: 'B', analysis: 'FOF（Fund of Funds）即基金中的基金，不直接投资于股票、债券等资产，而是投资于其他基金，通过配置多只基金实现多元化投资，风险通常低于股票基金。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2022,
  },
  // 基金从业知识 - 判断题
  {
    id: 'q43', content: '货币市场基金的风险很低，几乎不会亏损。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '货币市场基金主要投资于低风险的短期货币工具，风险极低，虽然理论上存在亏损可能，但实际中几乎不会发生本金亏损。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2023,
  },
  {
    id: 'q44', content: '基金托管人可以由基金管理人兼任。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '基金管理人和基金托管人应当相互独立，不得由同一机构兼任，以保证基金资产的安全和监督的有效性。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2022,
  },
  {
    id: 'q45', content: '指数基金的管理费率通常高于主动管理基金。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '指数基金采用被动投资策略，管理成本较低，管理费率通常低于主动管理基金。主动管理基金需要基金经理进行主动选股和调仓，管理成本较高。',
    difficulty: 'hard', subjectId: 's3', subjectName: '基金从业知识', year: 2024,
  },
  {
    id: 'q46', content: '基金份额持有人大会是基金的最高权力机构。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '基金份额持有人大会是基金的最高权力机构，由全体基金份额持有人组成，行使审议基金重大事项的职权。',
    difficulty: 'easy', subjectId: 's3', subjectName: '基金从业知识', year: 2023,
  },
  // 基金从业知识 - 简答题
  {
    id: 'q47', content: '简述开放式基金和封闭式基金的主要区别。',
    type: 'short',
    answer: '开放式基金和封闭式基金的主要区别包括：1.份额规模：开放式基金份额不固定，封闭式基金份额固定；2.交易场所：开放式基金通过基金公司申购赎回，封闭式基金在交易所交易；3.交易价格：开放式基金以基金净值为价格，封闭式基金价格由市场供求决定；4.流动性：开放式基金流动性较强，可随时申购赎回，封闭式基金流动性取决于市场交易；5.投资策略：开放式基金需保留一定现金应对赎回，封闭式基金可进行长期投资。',
    analysis: '理解开放式基金和封闭式基金的区别是基金基础知识的核心内容。',
    difficulty: 'hard', subjectId: 's3', subjectName: '基金从业知识', year: 2023,
  },
  {
    id: 'q48', content: '简述基金管理人的职责。',
    type: 'short',
    answer: '基金管理人的主要职责包括：1.基金募集：负责基金的募集和份额发售；2.投资决策：制定投资策略，进行证券投资；3.风险管理：建立风险控制体系，防范投资风险；4.基金估值：计算基金份额净值；5.信息披露：定期披露基金信息；6.客户服务：提供基金相关的客户服务；7.合规管理：确保基金运作符合法律法规和基金合同约定。',
    analysis: '掌握基金管理人的职责对于理解基金运作机制至关重要。',
    difficulty: 'hard', subjectId: 's3', subjectName: '基金从业知识', year: 2024,
  },

  // 风险管理 - 选择题
  {
    id: 'q49', content: '金融风险的分类不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '市场风险' },
      { label: 'B', content: '信用风险' },
      { label: 'C', content: '操作风险' },
      { label: 'D', content: '自然风险' },
    ],
    answer: 'D', analysis: '金融风险主要分为市场风险、信用风险、操作风险、流动性风险、合规风险等。自然风险不属于金融风险范畴。',
    difficulty: 'easy', subjectId: 's4', subjectName: '风险管理', year: 2023,
  },
  {
    id: 'q50', content: '下列关于VaR的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: 'VaR是指在一定置信水平下，某一金融资产在未来特定时间段内的最大可能损失' },
      { label: 'B', content: 'VaR不需要考虑置信水平' },
      { label: 'C', content: 'VaR只能用于衡量信用风险' },
      { label: 'D', content: 'VaR是一种定性风险度量方法' },
    ],
    answer: 'A', analysis: 'VaR（Value at Risk）即风险价值，是指在一定置信水平下，某一金融资产或投资组合在未来特定时间段内的最大可能损失。它是一种定量风险度量方法，可用于衡量市场风险等多种风险。',
    difficulty: 'medium', subjectId: 's4', subjectName: '风险管理', year: 2022,
  },
  {
    id: 'q51', content: '信用风险的主要度量方法不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '信用评级' },
      { label: 'B', content: '信用评分' },
      { label: 'C', content: 'VaR模型' },
      { label: 'D', content: '蒙特卡洛模拟' },
    ],
    answer: 'C', analysis: '信用风险的度量方法包括信用评级、信用评分、信用违约概率模型、蒙特卡洛模拟等。VaR模型主要用于衡量市场风险。',
    difficulty: 'medium', subjectId: 's4', subjectName: '风险管理', year: 2024,
  },
  {
    id: 'q52', content: '下列属于操作风险的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '利率变动导致债券价格下跌' },
      { label: 'B', content: '借款人违约' },
      { label: 'C', content: '员工操作失误导致资金损失' },
      { label: 'D', content: '汇率波动导致资产贬值' },
    ],
    answer: 'C', analysis: '操作风险是指由于内部程序、人员、系统的不完善或失误，或外部事件导致的风险。员工操作失误属于典型的操作风险。利率变动和汇率波动属于市场风险，借款人违约属于信用风险。',
    difficulty: 'easy', subjectId: 's4', subjectName: '风险管理', year: 2023,
  },
  {
    id: 'q53', content: '风险管理的流程不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '风险识别' },
      { label: 'B', content: '风险评估' },
      { label: 'C', content: '风险应对' },
      { label: 'D', content: '风险消除' },
    ],
    answer: 'D', analysis: '风险管理流程包括风险识别、风险评估、风险应对和风险监控。风险无法完全消除，只能通过各种措施进行管理和控制。',
    difficulty: 'easy', subjectId: 's4', subjectName: '风险管理', year: 2022,
  },
  {
    id: 'q54', content: '下列关于风险分散的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '风险分散可以消除系统性风险' },
      { label: 'B', content: '风险分散通过投资多种资产降低非系统性风险' },
      { label: 'C', content: '风险分散不需要考虑资产相关性' },
      { label: 'D', content: '风险分散会增加投资收益' },
    ],
    answer: 'B', analysis: '风险分散通过投资多种不相关或低相关的资产，可以有效降低非系统性风险，但无法消除系统性风险。风险分散的效果取决于资产之间的相关性。',
    difficulty: 'medium', subjectId: 's4', subjectName: '风险管理', year: 2024,
  },
  {
    id: 'q55', content: '巴塞尔协议Ⅲ的核心内容不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '提高资本充足率要求' },
      { label: 'B', content: '引入杠杆率监管' },
      { label: 'C', content: '增加银行存款利率' },
      { label: 'D', content: '建立流动性风险监管指标' },
    ],
    answer: 'C', analysis: '巴塞尔协议Ⅲ的核心内容包括提高资本充足率要求、引入杠杆率监管、建立流动性风险监管指标等。增加银行存款利率不属于巴塞尔协议Ⅲ的内容。',
    difficulty: 'easy', subjectId: 's4', subjectName: '风险管理', year: 2023,
  },
  {
    id: 'q56', content: '下列关于压力测试的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '压力测试只考虑正常市场情况' },
      { label: 'B', content: '压力测试用于评估极端市场情况下的风险暴露' },
      { label: 'C', content: '压力测试不需要设定情景' },
      { label: 'D', content: '压力测试结果不能用于风险管理决策' },
    ],
    answer: 'B', analysis: '压力测试是一种风险度量方法，通过设定极端情景（如市场暴跌、利率大幅变动等），评估金融机构在极端市场情况下的风险暴露和损失，为风险管理决策提供依据。',
    difficulty: 'medium', subjectId: 's4', subjectName: '风险管理', year: 2021,
  },
  {
    id: 'q57', content: '流动性风险的表现形式不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '无法及时满足客户取款需求' },
      { label: 'B', content: '无法按时偿还到期债务' },
      { label: 'C', content: '资产价格大幅上涨' },
      { label: 'D', content: '无法及时卖出资产变现' },
    ],
    answer: 'C', analysis: '流动性风险是指金融机构无法及时满足资金需求或无法及时变现资产的风险。资产价格大幅上涨不是流动性风险的表现，反而可能是市场风险的正面情况。',
    difficulty: 'easy', subjectId: 's4', subjectName: '风险管理', year: 2024,
  },
  {
    id: 'q58', content: '下列关于风险对冲的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '风险对冲通过持有相反方向的头寸来抵消风险' },
      { label: 'B', content: '风险对冲可以使用金融衍生品' },
      { label: 'C', content: '风险对冲一定会降低投资收益' },
      { label: 'D', content: '风险对冲可以用于管理市场风险' },
    ],
    answer: 'C', analysis: '风险对冲通过持有相反方向的头寸（如期货、期权等金融衍生品）来抵消风险。虽然对冲可能降低潜在收益，但也能降低潜在损失，并非一定会降低投资收益。',
    difficulty: 'medium', subjectId: 's4', subjectName: '风险管理', year: 2022,
  },
  // 风险管理 - 判断题
  {
    id: 'q59', content: '市场风险是指因市场价格变动而导致金融资产损失的风险。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '市场风险确实是指因市场价格（如利率、汇率、股价等）变动而导致金融资产价值损失的风险，包括利率风险、汇率风险、股票价格风险等。',
    difficulty: 'easy', subjectId: 's4', subjectName: '风险管理', year: 2023,
  },
  {
    id: 'q60', content: '信用风险只存在于贷款业务中。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '信用风险不仅存在于贷款业务中，还存在于债券投资、同业拆借、贸易融资等多种金融业务中，只要存在交易对手违约的可能性，就存在信用风险。',
    difficulty: 'easy', subjectId: 's4', subjectName: '风险管理', year: 2022,
  },
  {
    id: 'q61', content: '操作风险可以通过完善内部控制来完全消除。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '完善的内部控制可以有效降低操作风险，但无法完全消除。操作风险具有内生性，总会存在一定的残余风险。',
    difficulty: 'medium', subjectId: 's4', subjectName: '风险管理', year: 2024,
  },
  {
    id: 'q62', content: '风险转移是指通过保险等方式将风险转移给第三方。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '风险转移是风险应对策略之一，通过购买保险、签订担保协议、使用金融衍生品等方式，将风险的影响转移给第三方。',
    difficulty: 'easy', subjectId: 's4', subjectName: '风险管理', year: 2023,
  },
  // 风险管理 - 简答题
  {
    id: 'q63', content: '简述金融风险的主要类型。',
    type: 'short',
    answer: '金融风险主要包括：1.市场风险：因市场价格变动导致资产损失的风险，包括利率风险、汇率风险、股票价格风险、商品价格风险等；2.信用风险：交易对手违约导致损失的风险；3.操作风险：因内部程序、人员、系统不完善或失误导致的风险；4.流动性风险：无法及时满足资金需求或变现资产的风险；5.合规风险：违反法律法规或监管要求导致的风险；6.声誉风险：因负面事件导致机构声誉受损的风险；7.战略风险：因战略决策失误导致的风险。',
    analysis: '理解金融风险的分类是风险管理的基础。',
    difficulty: 'hard', subjectId: 's4', subjectName: '风险管理', year: 2023,
  },
  {
    id: 'q64', content: '简述风险管理的主要流程。',
    type: 'short',
    answer: '风险管理流程包括：1.风险识别：识别潜在的风险因素和风险事件；2.风险评估：评估风险发生的概率和影响程度，确定风险等级；3.风险应对：根据风险等级采取相应的应对策略，包括风险规避、风险转移、风险减轻、风险接受等；4.风险监控：持续监测风险变化，评估应对措施的有效性；5.风险报告：定期向管理层和相关方报告风险状况和风险管理情况。',
    analysis: '掌握风险管理流程对于有效管理金融风险至关重要。',
    difficulty: 'hard', subjectId: 's4', subjectName: '风险管理', year: 2024,
  },

  // 金融市场基础 - 选择题
  {
    id: 'q65', content: '金融市场按交易期限可分为（）。',
    type: 'choice', options: [
      { label: 'A', content: '货币市场和资本市场' },
      { label: 'B', content: '现货市场和期货市场' },
      { label: 'C', content: '一级市场和二级市场' },
      { label: 'D', content: '国内市场和国际市场' },
    ],
    answer: 'A', analysis: '金融市场按交易期限可分为货币市场（一年以内）和资本市场（一年以上）。现货市场和期货市场是按交割时间划分，一级市场和二级市场是按交易阶段划分。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2023,
  },
  {
    id: 'q66', content: '下列属于货币市场工具的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '股票' },
      { label: 'B', content: '中长期债券' },
      { label: 'C', content: '同业存单' },
      { label: 'D', content: '基金' },
    ],
    answer: 'C', analysis: '货币市场工具包括短期国债、同业存单、回购协议、大额可转让存单等。股票、中长期债券、基金属于资本市场工具。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2022,
  },
  {
    id: 'q67', content: '中央银行的职能不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '发行货币' },
      { label: 'B', content: '制定货币政策' },
      { label: 'C', content: '发放商业贷款' },
      { label: 'D', content: '监管金融机构' },
    ],
    answer: 'C', analysis: '中央银行的职能包括发行货币、制定货币政策、监管金融机构、维护金融稳定等。发放商业贷款是商业银行的职能。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2024,
  },
  {
    id: 'q68', content: '下列关于商业银行的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '商业银行不吸收存款' },
      { label: 'B', content: '商业银行主要通过发放贷款获取利润' },
      { label: 'C', content: '商业银行不需要缴纳存款准备金' },
      { label: 'D', content: '商业银行不能从事中间业务' },
    ],
    answer: 'B', analysis: '商业银行主要通过吸收存款、发放贷款、办理结算等业务获取利润。商业银行需要按照规定缴纳存款准备金，也可以从事中间业务（如支付结算、代理业务等）。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2023,
  },
  {
    id: 'q69', content: '货币政策的三大工具不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '存款准备金率' },
      { label: 'B', content: '再贴现率' },
      { label: 'C', content: '公开市场操作' },
      { label: 'D', content: '税率' },
    ],
    answer: 'D', analysis: '货币政策的三大工具是存款准备金率、再贴现率和公开市场操作。税率是财政政策工具，不属于货币政策工具。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2022,
  },
  {
    id: 'q70', content: '下列关于一级市场和二级市场的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '一级市场是交易已发行证券的市场' },
      { label: 'B', content: '二级市场是发行新证券的市场' },
      { label: 'C', content: '一级市场为发行人筹集资金' },
      { label: 'D', content: '二级市场不提供流动性' },
    ],
    answer: 'C', analysis: '一级市场是发行新证券的市场，为发行人筹集资金；二级市场是交易已发行证券的市场，为投资者提供流动性。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2024,
  },
  {
    id: 'q71', content: '下列关于汇率的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '汇率是两种货币之间的兑换比率' },
      { label: 'B', content: '直接标价法下，汇率上升表示本币升值' },
      { label: 'C', content: '间接标价法下，汇率上升表示本币升值' },
      { label: 'D', content: '汇率受多种因素影响' },
    ],
    answer: 'B', analysis: '在直接标价法下，汇率上升表示单位外币兑换更多的本币，即本币贬值。在间接标价法下，汇率上升表示单位本币兑换更多的外币，即本币升值。',
    difficulty: 'medium', subjectId: 's5', subjectName: '金融市场基础', year: 2023,
  },
  {
    id: 'q72', content: '下列属于金融衍生品的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '股票' },
      { label: 'B', content: '债券' },
      { label: 'C', content: '期货' },
      { label: 'D', content: '基金' },
    ],
    answer: 'C', analysis: '金融衍生品是基于基础金融资产衍生出来的金融工具，包括期货、期权、互换、远期等。股票、债券、基金属于基础金融资产。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2021,
  },
  {
    id: 'q73', content: '下列关于存款保险制度的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '存款保险只保障企业存款' },
      { label: 'B', content: '存款保险没有最高赔付限额' },
      { label: 'C', content: '存款保险由商业银行自行运营' },
      { label: 'D', content: '存款保险保护存款人的利益' },
    ],
    answer: 'D', analysis: '存款保险制度是为了保护存款人的利益，当银行发生风险时，存款保险机构会对存款人进行赔付。我国存款保险的最高赔付限额为50万元，覆盖个人和企业存款。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2024,
  },
  {
    id: 'q74', content: '金融监管的目标不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '维护金融稳定' },
      { label: 'B', content: '保护投资者利益' },
      { label: 'C', content: '促进经济增长' },
      { label: 'D', content: '垄断金融市场' },
    ],
    answer: 'D', analysis: '金融监管的目标包括维护金融稳定、保护投资者利益、促进公平竞争、促进经济增长等。垄断金融市场不是金融监管的目标，相反，监管机构会防止金融市场垄断。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2022,
  },
  // 金融市场基础 - 判断题
  {
    id: 'q75', content: '货币市场的特点是交易期限短、流动性强、风险低。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '货币市场主要交易短期金融工具，期限通常在一年以内，具有流动性强、风险低的特点，是金融机构进行短期资金融通的场所。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2023,
  },
  {
    id: 'q76', content: '中央银行是商业银行的银行。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '中央银行作为"银行的银行"，为商业银行提供清算服务、再贷款、再贴现等业务，是商业银行的最后贷款人。',
    difficulty: 'medium', subjectId: 's5', subjectName: '金融市场基础', year: 2022,
  },
  {
    id: 'q77', content: '通货膨胀会导致货币购买力上升。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '通货膨胀会导致物价上涨，单位货币能够购买的商品和服务减少，即货币购买力下降。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2024,
  },
  {
    id: 'q78', content: '金融衍生品交易风险较低。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '金融衍生品具有高杠杆性，交易风险较高，可能带来巨大损失。投资者需要具备专业知识和风险承受能力才能参与衍生品交易。',
    difficulty: 'easy', subjectId: 's5', subjectName: '金融市场基础', year: 2023,
  },
  // 金融市场基础 - 简答题
  {
    id: 'q79', content: '简述金融市场的功能。',
    type: 'short',
    answer: '金融市场的主要功能包括：1.资金融通：实现资金从盈余方到短缺方的转移；2.价格发现：通过交易形成金融资产的价格；3.风险管理：提供风险转移和对冲工具；4.资源配置：引导资金流向效率高的领域；5.信息传递：反映宏观经济和企业经营状况；6.流动性提供：为投资者提供资产变现的渠道。',
    analysis: '理解金融市场的功能是金融市场基础的核心内容。',
    difficulty: 'hard', subjectId: 's5', subjectName: '金融市场基础', year: 2023,
  },
  {
    id: 'q80', content: '简述商业银行的主要业务。',
    type: 'short',
    answer: '商业银行的主要业务包括：1.负债业务：吸收存款、发行债券等，是银行资金的来源；2.资产业务：发放贷款、投资债券等，是银行资金的运用；3.中间业务：支付结算、代理业务、咨询业务等，不占用银行资金但收取手续费；4.表外业务：贷款承诺、担保业务、衍生品交易等，不在资产负债表中反映但可能影响银行风险。',
    analysis: '掌握商业银行的业务分类对于理解银行运作至关重要。',
    difficulty: 'hard', subjectId: 's5', subjectName: '金融市场基础', year: 2024,
  },

  // 商业银行管理 - 选择题
  {
    id: 'q81', content: '商业银行的核心资本不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '实收资本' },
      { label: 'B', content: '资本公积' },
      { label: 'C', content: '优先股' },
      { label: 'D', content: '留存收益' },
    ],
    answer: 'C', analysis: '商业银行的核心资本包括实收资本、资本公积、盈余公积、留存收益等。优先股属于附属资本，不属于核心资本。',
    difficulty: 'medium', subjectId: 's6', subjectName: '商业银行管理', year: 2023,
  },
  {
    id: 'q82', content: '商业银行的流动性比率不得低于（）。',
    type: 'choice', options: [
      { label: 'A', content: '10%' },
      { label: 'B', content: '25%' },
      { label: 'C', content: '50%' },
      { label: 'D', content: '75%' },
    ],
    answer: 'B', analysis: '根据《商业银行法》规定，商业银行的流动性比率不得低于25%，以确保银行有足够的流动性应对客户提取存款的需求。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2022,
  },
  {
    id: 'q83', content: '商业银行的贷款五级分类不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '正常贷款' },
      { label: 'B', content: '关注贷款' },
      { label: 'C', content: '次级贷款' },
      { label: 'D', content: '短期贷款' },
    ],
    answer: 'D', analysis: '商业银行贷款五级分类包括正常、关注、次级、可疑、损失五类。短期贷款是按贷款期限分类，不属于五级分类范畴。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2024,
  },
  {
    id: 'q84', content: '下列关于商业银行内部控制的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '内部控制不需要贯穿业务全过程' },
      { label: 'B', content: '内部控制只需要高层管理人员参与' },
      { label: 'C', content: '内部控制的目标是防范风险' },
      { label: 'D', content: '内部控制可以代替风险管理' },
    ],
    answer: 'C', analysis: '商业银行内部控制的目标是防范风险、保证业务合法合规、保障资产安全等。内部控制需要贯穿业务全过程，全体员工参与，是风险管理的重要组成部分但不能代替风险管理。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2023,
  },
  {
    id: 'q85', content: '商业银行的不良贷款率是指（）占总贷款余额的比例。',
    type: 'choice', options: [
      { label: 'A', content: '正常贷款' },
      { label: 'B', content: '关注贷款' },
      { label: 'C', content: '次级、可疑、损失贷款' },
      { label: 'D', content: '短期贷款' },
    ],
    answer: 'C', analysis: '不良贷款率是指次级、可疑、损失三类贷款余额占总贷款余额的比例，是衡量银行资产质量的重要指标。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2022,
  },
  {
    id: 'q86', content: '下列关于商业银行资本充足率的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '资本充足率越低越好' },
      { label: 'B', content: '资本充足率反映银行的盈利能力' },
      { label: 'C', content: '资本充足率是银行抵御风险的保障' },
      { label: 'D', content: '资本充足率与风险无关' },
    ],
    answer: 'C', analysis: '资本充足率是银行资本与风险加权资产的比率，反映银行抵御风险的能力。资本充足率越高，银行抵御风险的能力越强。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2024,
  },
  {
    id: 'q87', content: '商业银行的存款准备金率由（）决定。',
    type: 'choice', options: [
      { label: 'A', content: '商业银行自行决定' },
      { label: 'B', content: '中国人民银行' },
      { label: 'C', content: '银保监会' },
      { label: 'D', content: '财政部' },
    ],
    answer: 'B', analysis: '存款准备金率是货币政策工具之一，由中国人民银行决定和调整，用于调节市场货币供应量。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2023,
  },
  {
    id: 'q88', content: '下列关于商业银行同业拆借的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '同业拆借期限可以超过一年' },
      { label: 'B', content: '同业拆借是商业银行之间的短期资金融通' },
      { label: 'C', content: '同业拆借不需要支付利息' },
      { label: 'D', content: '同业拆借可以用于发放长期贷款' },
    ],
    answer: 'B', analysis: '同业拆借是商业银行之间的短期资金融通行为，期限通常较短（一般不超过一年），需要支付利息，主要用于弥补短期资金缺口，不能用于发放长期贷款。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2021,
  },
  {
    id: 'q89', content: '商业银行的拨备覆盖率是指（）。',
    type: 'choice', options: [
      { label: 'A', content: '贷款损失准备与不良贷款余额的比率' },
      { label: 'B', content: '存款余额与贷款余额的比率' },
      { label: 'C', content: '资本余额与资产余额的比率' },
      { label: 'D', content: '净利润与营业收入的比率' },
    ],
    answer: 'A', analysis: '拨备覆盖率是指贷款损失准备与不良贷款余额的比率，反映银行对不良贷款的覆盖能力，是衡量银行风险抵御能力的重要指标。',
    difficulty: 'medium', subjectId: 's6', subjectName: '商业银行管理', year: 2024,
  },
  {
    id: 'q90', content: '下列关于商业银行合规管理的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '合规管理是商业银行的核心风险管理活动' },
      { label: 'B', content: '合规管理不需要遵循法律法规' },
      { label: 'C', content: '合规管理应覆盖所有业务领域' },
      { label: 'D', content: '合规管理需要全员参与' },
    ],
    answer: 'B', analysis: '合规管理是商业银行的核心风险管理活动，必须遵循法律法规和监管要求，覆盖所有业务领域，需要全员参与。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2022,
  },
  // 商业银行管理 - 判断题
  {
    id: 'q91', content: '商业银行的资本充足率不得低于8%。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据巴塞尔协议和我国监管要求，商业银行的资本充足率不得低于8%，其中核心一级资本充足率不得低于5%。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2023,
  },
  {
    id: 'q92', content: '商业银行的贷款余额可以超过存款余额。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '商业银行可以通过同业拆借、发行债券等方式获取资金用于发放贷款，因此贷款余额可以超过存款余额，但需要符合监管要求的存贷比限制。',
    difficulty: 'medium', subjectId: 's6', subjectName: '商业银行管理', year: 2022,
  },
  {
    id: 'q93', content: '商业银行的内部控制只需要在业务发生时进行。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '商业银行的内部控制需要贯穿业务全过程，包括事前防范、事中控制、事后监督，而不仅仅是在业务发生时进行。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2024,
  },
  {
    id: 'q94', content: '商业银行的不良贷款包括次级、可疑和损失三类。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据贷款五级分类制度，不良贷款包括次级、可疑和损失三类，正常和关注类贷款不属于不良贷款。',
    difficulty: 'easy', subjectId: 's6', subjectName: '商业银行管理', year: 2023,
  },
  // 商业银行管理 - 简答题
  {
    id: 'q95', content: '简述商业银行风险管理的主要流程。',
    type: 'short',
    answer: '商业银行风险管理的主要流程包括：1.风险识别：识别银行面临的各种风险，如信用风险、市场风险、操作风险等；2.风险评估：对识别出的风险进行量化评估，确定风险等级；3.风险控制：制定风险控制策略，如风险规避、风险转移、风险分散、风险对冲等；4.风险监测：持续监测风险状况，及时发现风险变化；5.风险报告：定期向管理层和监管机构报告风险状况。',
    analysis: '商业银行风险管理流程是银行经营管理的核心内容。',
    difficulty: 'hard', subjectId: 's6', subjectName: '商业银行管理', year: 2023,
  },
  {
    id: 'q96', content: '简述商业银行内部控制的基本原则。',
    type: 'short',
    answer: '商业银行内部控制的基本原则包括：1.全面性原则：内部控制应覆盖所有业务和所有环节；2.审慎性原则：内部控制应以防范风险为核心；3.有效性原则：内部控制措施应切实有效；4.独立性原则：内部控制部门应保持独立性；5.制衡性原则：业务流程和部门之间应相互制衡；6.及时性原则：内部控制应及时发现和处理风险。',
    analysis: '内部控制原则是商业银行建立健全内部控制体系的基础。',
    difficulty: 'hard', subjectId: 's6', subjectName: '商业银行管理', year: 2024,
  },
];

subjects.forEach((subject) => {
  subject.questionCount = questions.filter((q) => q.subjectId === subject.id).length;
});

export const answerRecords: AnswerRecord[] = [];

export const favoriteRecords: FavoriteRecord[] = [];