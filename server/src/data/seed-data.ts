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
  { id: 's1', name: '建设工程法规', icon: 'law', questionCount: 0, color: 'blue' },
  { id: 's2', name: '项目管理', icon: 'manage', questionCount: 0, color: 'emerald' },
  { id: 's3', name: '工程经济', icon: 'economy', questionCount: 0, color: 'amber' },
  { id: 's4', name: '建筑工程实务', icon: 'build', questionCount: 0, color: 'purple' },
  { id: 's5', name: '安全管理', icon: 'safety', questionCount: 0, color: 'rose' },
  { id: 's6', name: '质量管理', icon: 'quality', questionCount: 0, color: 'cyan' },
];

export const questions: QuestionData[] = [
  // 建设工程法规 - 选择题
  {
    id: 'q1', content: '根据《建筑法》，建筑工程开工前，建设单位应当按照国家有关规定向工程所在地县级以上人民政府建设行政主管部门申请领取（）。',
    type: 'choice', options: [
      { label: 'A', content: '施工许可证' },
      { label: 'B', content: '规划许可证' },
      { label: 'C', content: '安全生产许可证' },
      { label: 'D', content: '营业执照' },
    ],
    answer: 'A', analysis: '根据《建筑法》第七条规定，建筑工程开工前，建设单位应当按照国家有关规定向工程所在地县级以上人民政府建设行政主管部门申请领取施工许可证。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规', year: 2023,
  },
  {
    id: 'q2', content: '建设工程竣工验收合格后，建设单位应当在规定的时间内将竣工验收报告报送建设行政主管部门备案。该期限为（）。',
    type: 'choice', options: [
      { label: 'A', content: '15日' },
      { label: 'B', content: '30日' },
      { label: 'C', content: '45日' },
      { label: 'D', content: '60日' },
    ],
    answer: 'A', analysis: '根据《建设工程质量管理条例》第四十九条规定，建设单位应当自建设工程竣工验收合格之日起15日内，将建设工程竣工验收报告报送建设行政主管部门备案。',
    difficulty: 'medium', subjectId: 's1', subjectName: '建设工程法规', year: 2022,
  },
  {
    id: 'q3', content: '根据《招标投标法》，下列关于投标保证金的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '投标保证金不得超过招标项目估算价的2%' },
      { label: 'B', content: '投标保证金不得超过投标报价的2%' },
      { label: 'C', content: '投标保证金最高不超过100万元' },
      { label: 'D', content: '投标保证金有效期应当与投标有效期一致' },
    ],
    answer: 'D', analysis: '根据《招标投标法实施条例》第二十六条规定，投标保证金有效期应当与投标有效期一致。投标保证金不得超过招标项目估算价的2%，最高不超过80万元人民币。',
    difficulty: 'medium', subjectId: 's1', subjectName: '建设工程法规', year: 2023,
  },
  {
    id: 'q4', content: '根据《民法典》，建设工程合同的订立应当采用（）形式。',
    type: 'choice', options: [
      { label: 'A', content: '口头' },
      { label: 'B', content: '书面' },
      { label: 'C', content: '口头或书面' },
      { label: 'D', content: '电子' },
    ],
    answer: 'B', analysis: '根据《民法典》第七百八十九条规定，建设工程合同应当采用书面形式。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规', year: 2022,
  },
  {
    id: 'q5', content: '下列关于建设工程分包的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '总承包单位可以将其承包的全部建设工程转包给第三人' },
      { label: 'B', content: '总承包单位可以将其承包的全部建设工程肢解以后以分包的名义分别转包给第三人' },
      { label: 'C', content: '禁止总承包单位将工程分包给不具备相应资质条件的单位' },
      { label: 'D', content: '分包单位可以将其承包的工程再分包' },
    ],
    answer: 'C', analysis: '根据《建筑法》规定，禁止总承包单位将工程分包给不具备相应资质条件的单位，禁止分包单位将其承包的工程再分包。',
    difficulty: 'medium', subjectId: 's1', subjectName: '建设工程法规', year: 2024,
  },
  {
    id: 'q6', content: '建设单位应当自领取施工许可证之日起（）内开工。',
    type: 'choice', options: [
      { label: 'A', content: '1个月' },
      { label: 'B', content: '3个月' },
      { label: 'C', content: '6个月' },
      { label: 'D', content: '12个月' },
    ],
    answer: 'B', analysis: '根据《建筑法》第九条规定，建设单位应当自领取施工许可证之日起三个月内开工。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规', year: 2021,
  },
  {
    id: 'q7', content: '根据《建设工程安全生产管理条例》，施工单位应当设立（）机构，配备专职安全生产管理人员。',
    type: 'choice', options: [
      { label: 'A', content: '安全生产监督' },
      { label: 'B', content: '安全生产管理' },
      { label: 'C', content: '安全生产检查' },
      { label: 'D', content: '安全生产协调' },
    ],
    answer: 'B', analysis: '根据《建设工程安全生产管理条例》第二十三条规定，施工单位应当设立安全生产管理机构，配备专职安全生产管理人员。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规', year: 2023,
  },
  {
    id: 'q8', content: '下列关于工程监理单位的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '工程监理单位可以转让工程监理业务' },
      { label: 'B', content: '工程监理单位应当依法取得相应等级的资质证书' },
      { label: 'C', content: '工程监理单位可以与施工单位串通，弄虚作假' },
      { label: 'D', content: '工程监理单位不需要对施工质量承担监理责任' },
    ],
    answer: 'B', analysis: '根据《建筑法》规定，工程监理单位应当依法取得相应等级的资质证书，并在其资质等级许可的范围内承担工程监理业务。',
    difficulty: 'medium', subjectId: 's1', subjectName: '建设工程法规', year: 2024,
  },
  {
    id: 'q9', content: '根据《建设工程质量管理条例》，下列不属于建设单位质量责任和义务的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '将施工图设计文件报县级以上人民政府建设行政主管部门或者其他有关部门审查' },
      { label: 'B', content: '建立、健全教育培训制度' },
      { label: 'C', content: '在领取施工许可证或者开工报告前，按照国家有关规定办理工程质量监督手续' },
      { label: 'D', content: '组织竣工验收' },
    ],
    answer: 'B', analysis: '建立、健全教育培训制度是施工单位的责任和义务，而非建设单位的。',
    difficulty: 'hard', subjectId: 's1', subjectName: '建设工程法规', year: 2022,
  },
  {
    id: 'q10', content: '根据《安全生产许可证条例》，安全生产许可证的有效期为（）。',
    type: 'choice', options: [
      { label: 'A', content: '2年' },
      { label: 'B', content: '3年' },
      { label: 'C', content: '4年' },
      { label: 'D', content: '5年' },
    ],
    answer: 'B', analysis: '根据《安全生产许可证条例》第九条规定，安全生产许可证的有效期为3年。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规', year: 2021,
  },
  // 建设工程法规 - 判断题
  {
    id: 'q11', content: '建筑施工企业应当依法为职工参加工伤保险缴纳工伤保险费，鼓励企业为从事危险作业的职工办理意外伤害保险。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据《建筑法》第四十八条规定，建筑施工企业应当依法为职工参加工伤保险缴纳工伤保险费。鼓励企业为从事危险作业的职工办理意外伤害保险，支付保险费。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规', year: 2023,
  },
  {
    id: 'q12', content: '建设工程竣工验收应当具备的条件之一是有施工单位签署的工程保修书。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据《建设工程质量管理条例》第十六条规定，建设工程竣工验收应当具备施工单位签署的工程保修书等条件。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规', year: 2022,
  },
  {
    id: 'q13', content: '未经监理工程师签字，建筑材料、建筑构配件和设备不得在工程上使用或者安装。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据《建设工程质量管理条例》第三十七条规定，未经监理工程师签字，建筑材料、建筑构配件和设备不得在工程上使用或者安装，施工单位不得进行下一道工序的施工。',
    difficulty: 'medium', subjectId: 's1', subjectName: '建设工程法规', year: 2024,
  },
  {
    id: 'q14', content: '建设单位可以明示或者暗示施工单位使用不合格的建筑材料、建筑构配件和设备。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '根据《建设工程质量管理条例》第十条规定，建设单位不得明示或者暗示施工单位使用不合格的建筑材料、建筑构配件和设备。',
    difficulty: 'easy', subjectId: 's1', subjectName: '建设工程法规', year: 2021,
  },
  // 建设工程法规 - 简答题
  {
    id: 'q15', content: '简述建筑工程施工许可证的申请条件。',
    type: 'short',
    answer: '建筑工程施工许可证申请条件包括：1.已经办理该建筑工程用地批准手续；2.在城市规划区的建筑工程，已经取得规划许可证；3.需要拆迁的，其拆迁进度符合施工要求；4.已经确定建筑施工企业；5.有满足施工需要的施工图纸及技术资料；6.有保证工程质量和安全的具体措施；7.建设资金已经落实；8.法律、行政法规规定的其他条件。',
    analysis: '施工许可证申请条件是《建筑法》第八条的核心内容，需要全面掌握各项条件。',
    difficulty: 'hard', subjectId: 's1', subjectName: '建设工程法规', year: 2023,
  },
  {
    id: 'q16', content: '简述建设工程竣工验收应当具备的条件。',
    type: 'short',
    answer: '建设工程竣工验收应当具备下列条件：1.完成建设工程设计和合同约定的各项内容；2.有完整的技术档案和施工管理资料；3.有工程使用的主要建筑材料、建筑构配件和设备的进场试验报告；4.有勘察、设计、施工、工程监理等单位分别签署的质量合格文件；5.有施工单位签署的工程保修书。',
    analysis: '竣工验收条件是工程质量管理的重要知识点，需要全面掌握。',
    difficulty: 'hard', subjectId: 's1', subjectName: '建设工程法规', year: 2024,
  },

  // 项目管理 - 选择题
  {
    id: 'q17', content: '在项目管理中，WBS是指（）。',
    type: 'choice', options: [
      { label: 'A', content: '工作分解结构' },
      { label: 'B', content: '项目进度计划' },
      { label: 'C', content: '项目成本预算' },
      { label: 'D', content: '项目质量控制' },
    ],
    answer: 'A', analysis: 'WBS（Work Breakdown Structure）即工作分解结构，是将项目可交付成果和项目工作分解成较小的、更易于管理的组件的过程。',
    difficulty: 'easy', subjectId: 's2', subjectName: '项目管理', year: 2023,
  },
  {
    id: 'q18', content: '关键路径法（CPM）中，关键路径是指项目网络图中（）的路径。',
    type: 'choice', options: [
      { label: 'A', content: '工期最长' },
      { label: 'B', content: '工期最短' },
      { label: 'C', content: '资源消耗最多' },
      { label: 'D', content: '风险最大' },
    ],
    answer: 'A', analysis: '关键路径是项目网络图中工期最长的路径，它决定了项目的最短完成时间。关键路径上的活动如果延误，将直接导致项目总工期延长。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理', year: 2022,
  },
  {
    id: 'q19', content: '在项目进度管理中，甘特图的主要缺点是（）。',
    type: 'choice', options: [
      { label: 'A', content: '不能直观显示各活动的起止时间' },
      { label: 'B', content: '不能清楚地表示活动之间的依赖关系' },
      { label: 'C', content: '不能用于大型项目' },
      { label: 'D', content: '不能显示项目进度' },
    ],
    answer: 'B', analysis: '甘特图虽然直观显示各活动的时间安排，但其主要缺点是不能清楚地表示活动之间的逻辑依赖关系，也不容易确定关键路径。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理', year: 2024,
  },
  {
    id: 'q20', content: '项目管理中，PMBOK指南将项目管理知识划分为（）个知识领域。',
    type: 'choice', options: [
      { label: 'A', content: '4' },
      { label: 'B', content: '5' },
      { label: 'C', content: '9' },
      { label: 'D', content: '10' },
    ],
    answer: 'D', analysis: 'PMBOK指南将项目管理知识划分为10个知识领域：整合管理、范围管理、进度管理、成本管理、质量管理、资源管理、风险管理、采购管理、沟通管理、相关方管理。',
    difficulty: 'easy', subjectId: 's2', subjectName: '项目管理', year: 2023,
  },
  {
    id: 'q21', content: '下列关于项目章程的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '项目章程由项目经理制定' },
      { label: 'B', content: '项目章程是正式批准项目成立的文件' },
      { label: 'C', content: '项目章程包含详细的项目计划' },
      { label: 'D', content: '项目章程在项目执行阶段发布' },
    ],
    answer: 'B', analysis: '项目章程是由项目发起人发布的，正式批准项目成立，并授权项目经理使用组织资源开展项目活动的文件。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理', year: 2022,
  },
  {
    id: 'q22', content: '项目范围管理中，范围基准不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '范围说明书' },
      { label: 'B', content: 'WBS' },
      { label: 'C', content: 'WBS词典' },
      { label: 'D', content: '项目进度计划' },
    ],
    answer: 'D', analysis: '范围基准包括：项目范围说明书、WBS、WBS词典。项目进度计划不属于范围基准。',
    difficulty: 'hard', subjectId: 's2', subjectName: '项目管理', year: 2024,
  },
  {
    id: 'q23', content: '在项目成本管理中，挣值分析（EVM）是一种常用的方法，其中EV表示（）。',
    type: 'choice', options: [
      { label: 'A', content: '计划值' },
      { label: 'B', content: '挣值' },
      { label: 'C', content: '实际成本' },
      { label: 'D', content: '成本偏差' },
    ],
    answer: 'B', analysis: 'EV（Earned Value）即挣值，表示已完成工作的预算成本。PV是计划值，AC是实际成本。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理', year: 2023,
  },
  {
    id: 'q24', content: '项目风险管理中，风险概率和影响矩阵用于（）。',
    type: 'choice', options: [
      { label: 'A', content: '识别风险' },
      { label: 'B', content: '分析风险' },
      { label: 'C', content: '规划风险应对' },
      { label: 'D', content: '监控风险' },
    ],
    answer: 'B', analysis: '风险概率和影响矩阵是风险定性分析的工具，用于评估风险的概率和影响，从而确定风险的优先级。',
    difficulty: 'easy', subjectId: 's2', subjectName: '项目管理', year: 2021,
  },
  {
    id: 'q25', content: '下列关于敏捷开发的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '敏捷开发强调个体和交互高于流程和工具' },
      { label: 'B', content: '敏捷开发要求一次性交付完整的产品' },
      { label: 'C', content: '敏捷开发注重工作的软件高于详尽的文档' },
      { label: 'D', content: '敏捷开发倡导客户合作高于合同谈判' },
    ],
    answer: 'B', analysis: '敏捷开发强调迭代交付和持续改进，而不是一次性交付完整产品。敏捷宣言的核心价值观包括：个体和交互高于流程和工具、工作的软件高于详尽的文档、客户合作高于合同谈判、响应变化高于遵循计划。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理', year: 2024,
  },
  {
    id: 'q26', content: '项目管理中，PDCA循环中的A代表（）。',
    type: 'choice', options: [
      { label: 'A', content: '计划' },
      { label: 'B', content: '执行' },
      { label: 'C', content: '检查' },
      { label: 'D', content: '处理' },
    ],
    answer: 'D', analysis: 'PDCA循环中，P=Plan（计划）、D=Do（执行）、C=Check（检查）、A=Act（处理），是质量管理和持续改进的基本工作方法。',
    difficulty: 'easy', subjectId: 's2', subjectName: '项目管理', year: 2022,
  },
  // 项目管理 - 判断题
  {
    id: 'q27', content: '项目管理中，范围蔓延是指项目范围未经控制地不断扩大。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '范围蔓延（Scope Creep）确实是指项目范围在没有经过正式变更控制流程的情况下不断扩大，这通常会导致项目延期和超支。',
    difficulty: 'easy', subjectId: 's2', subjectName: '项目管理', year: 2023,
  },
  {
    id: 'q28', content: '关键路径上的活动总浮动时间为零。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '关键路径是项目网络图中最长的路径，决定了项目的最短完成时间。关键路径上的活动总浮动时间为零，任何延误都会直接影响项目总工期。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理', year: 2024,
  },
  {
    id: 'q29', content: '项目管理计划是一个单一的文档。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '项目管理计划不是一个单一的文档，而是由各规划过程组的输出组成的综合性计划，包括范围基准、进度基准、成本基准等。',
    difficulty: 'medium', subjectId: 's2', subjectName: '项目管理', year: 2022,
  },
  {
    id: 'q30', content: '挣值分析中，当CPI<1时，表示成本超支。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: 'CPI（成本绩效指数）=EV/AC，当CPI<1时，表示实际成本超过预算，即成本超支；当CPI>1时，表示成本节约。',
    difficulty: 'easy', subjectId: 's2', subjectName: '项目管理', year: 2023,
  },
  // 项目管理 - 简答题
  {
    id: 'q31', content: '简述项目管理中风险应对的主要策略。',
    type: 'short',
    answer: '风险应对策略主要包括：1.规避：改变项目计划以消除风险；2.转移：将风险的影响转移给第三方（如购买保险）；3.减轻：降低风险发生的概率或影响；4.接受：承担风险带来的后果，分为主动接受和被动接受。对于正面风险（机会）则采用开拓、分享、提高和接受策略。',
    analysis: '风险应对策略是项目管理的重要知识点，需要区分负面风险和正面风险的不同应对方式。',
    difficulty: 'hard', subjectId: 's2', subjectName: '项目管理', year: 2023,
  },
  {
    id: 'q32', content: '简述项目范围管理的主要过程。',
    type: 'short',
    answer: '项目范围管理的主要过程包括：1.规划范围管理：制定范围管理计划；2.收集需求：确定项目相关方的需求；3.定义范围：制定项目范围说明书；4.创建WBS：将项目可交付成果分解为工作包；5.确认范围：正式验收已完成的项目可交付成果；6.控制范围：监督项目范围的变更。',
    analysis: '范围管理是项目管理的核心知识领域之一，需要掌握各个过程的输入、工具和输出。',
    difficulty: 'hard', subjectId: 's2', subjectName: '项目管理', year: 2024,
  },

  // 工程经济 - 选择题
  {
    id: 'q33', content: '资金时间价值的本质是（）。',
    type: 'choice', options: [
      { label: 'A', content: '资金具有增值能力' },
      { label: 'B', content: '通货膨胀导致货币贬值' },
      { label: 'C', content: '资金用于投资可以产生收益' },
      { label: 'D', content: '以上都是' },
    ],
    answer: 'C', analysis: '资金时间价值的本质是资金用于投资（生产经营过程）可以产生收益，即资金在周转使用中由于利润的产生而增值。',
    difficulty: 'medium', subjectId: 's3', subjectName: '工程经济', year: 2023,
  },
  {
    id: 'q34', content: '某建设项目建设投资为1000万元，建设期利息为100万元，流动资金为200万元，则该项目的总投资为（）万元。',
    type: 'choice', options: [
      { label: 'A', content: '1000' },
      { label: 'B', content: '1100' },
      { label: 'C', content: '1200' },
      { label: 'D', content: '1300' },
    ],
    answer: 'D', analysis: '建设项目总投资 = 建设投资 + 建设期利息 + 流动资金 = 1000 + 100 + 200 = 1300万元。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济', year: 2022,
  },
  {
    id: 'q35', content: '设备租赁与购买方案比选中，通常采用的分析方法是（）。',
    type: 'choice', options: [
      { label: 'A', content: '净现值法' },
      { label: 'B', content: '增量投资收益率法' },
      { label: 'C', content: '年费用法' },
      { label: 'D', content: '内部收益率法' },
    ],
    answer: 'C', analysis: '设备租赁与购买方案比选通常采用年费用法，因为两种方案的服务期限通常相同，通过比较年费用大小来选择较优方案。',
    difficulty: 'medium', subjectId: 's3', subjectName: '工程经济', year: 2024,
  },
  {
    id: 'q36', content: '下列关于基准收益率的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '基准收益率是投资者可以接受的最低收益率' },
      { label: 'B', content: '基准收益率越高越好' },
      { label: 'C', content: '基准收益率越低越好' },
      { label: 'D', content: '基准收益率与项目风险无关' },
    ],
    answer: 'A', analysis: '基准收益率是企业或行业确定的投资方案最低标准收益水平，是投资者可以接受的最低收益率。基准收益率的确定应考虑资金成本、机会成本、投资风险和通货膨胀等因素。',
    difficulty: 'medium', subjectId: 's3', subjectName: '工程经济', year: 2023,
  },
  {
    id: 'q37', content: '某项目的净现值NPV>0，说明该项目（）。',
    type: 'choice', options: [
      { label: 'A', content: '盈利' },
      { label: 'B', content: '亏损' },
      { label: 'C', content: '刚好达到基准收益率' },
      { label: 'D', content: '无法判断' },
    ],
    answer: 'A', analysis: '净现值NPV>0说明该方案的收益率超过了基准收益率，项目盈利；NPV=0说明刚好达到基准收益率；NPV<0则项目亏损。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济', year: 2022,
  },
  {
    id: 'q38', content: '下列关于内部收益率（IRR）的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: 'IRR是使项目净现值为零的折现率' },
      { label: 'B', content: 'IRR越大越好' },
      { label: 'C', content: 'IRR与基准收益率无关' },
      { label: 'D', content: 'IRR不能用于多方案比选' },
    ],
    answer: 'A', analysis: '内部收益率（IRR）是使项目净现值为零的折现率。当IRR大于基准收益率时，项目可行。',
    difficulty: 'medium', subjectId: 's3', subjectName: '工程经济', year: 2024,
  },
  {
    id: 'q39', content: '在工程经济评价中，静态投资回收期的主要缺点是（）。',
    type: 'choice', options: [
      { label: 'A', content: '计算复杂' },
      { label: 'B', content: '不考虑资金时间价值' },
      { label: 'C', content: '不能反映投资回收速度' },
      { label: 'D', content: '不能用于方案比选' },
    ],
    answer: 'B', analysis: '静态投资回收期的主要缺点是不考虑资金时间价值，不能准确反映项目的经济效益。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济', year: 2023,
  },
  {
    id: 'q40', content: '价值工程中，价值V等于（）。',
    type: 'choice', options: [
      { label: 'A', content: '功能F/成本C' },
      { label: 'B', content: '成本C/功能F' },
      { label: 'C', content: '功能F×成本C' },
      { label: 'D', content: '功能F-成本C' },
    ],
    answer: 'A', analysis: '价值工程中，价值V=功能F/成本C。提高价值的途径包括：F↑C↓、F↑C不变、F不变C↓、F↑↑C↑、F↓C↓↓。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济', year: 2021,
  },
  {
    id: 'q41', content: '下列费用中，属于建设投资的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '流动资金' },
      { label: 'B', content: '建设期利息' },
      { label: 'C', content: '设备及工器具购置费' },
      { label: 'D', content: '运营期利息' },
    ],
    answer: 'C', analysis: '建设投资包括：设备及工器具购置费、建筑安装工程费、工程建设其他费用、预备费（基本预备费和涨价预备费）。流动资金和建设期利息不属于建设投资。',
    difficulty: 'medium', subjectId: 's3', subjectName: '工程经济', year: 2024,
  },
  {
    id: 'q42', content: '某设备原值为10万元，预计净残值为1万元，使用年限为5年，采用直线法计提折旧，则年折旧额为（）万元。',
    type: 'choice', options: [
      { label: 'A', content: '1.8' },
      { label: 'B', content: '2.0' },
      { label: 'C', content: '2.2' },
      { label: 'D', content: '1.6' },
    ],
    answer: 'A', analysis: '年折旧额 =（原值 - 净残值）/ 使用年限 =（10 - 1）/ 5 = 1.8万元。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济', year: 2022,
  },
  // 工程经济 - 判断题
  {
    id: 'q43', content: '净现值（NPV）大于零，说明该投资方案在经济上是可行的。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '净现值NPV>0说明该方案的收益率超过了基准收益率，在经济上是可行的。NPV=0说明刚好达到基准收益率，NPV<0则不可行。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济', year: 2023,
  },
  {
    id: 'q44', content: '资金时间价值是指资金在生产经营过程中产生的增值。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '资金时间价值的本质就是资金在周转使用中由于利润的产生而增值，即资金用于投资可以产生收益。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济', year: 2022,
  },
  {
    id: 'q45', content: '在互斥方案比选时，净现值法和内部收益率法的结论总是一致的。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '在互斥方案比选时，净现值法和内部收益率法的结论并不总是一致的。当方案的初始投资不同或现金流量模式不同时，可能会出现矛盾的结论，此时应以净现值法为准。',
    difficulty: 'hard', subjectId: 's3', subjectName: '工程经济', year: 2024,
  },
  {
    id: 'q46', content: '价值工程的核心是功能分析。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '价值工程的核心确实是功能分析，通过对产品功能的分析，找出不必要的功能，从而降低成本，提高价值。',
    difficulty: 'easy', subjectId: 's3', subjectName: '工程经济', year: 2023,
  },
  // 工程经济 - 简答题
  {
    id: 'q47', content: '简述工程经济评价中静态评价指标和动态评价指标的区别。',
    type: 'short',
    answer: '静态评价指标不考虑资金时间价值，如静态投资回收期、投资收益率等，计算简便但精度较低。动态评价指标考虑资金时间价值，如净现值（NPV）、内部收益率（IRR）、动态投资回收期等，更加准确地反映项目的经济效益。实际工程中，通常以动态指标为主，静态指标为辅。',
    analysis: '理解静态和动态指标的核心区别在于是否考虑资金时间价值。',
    difficulty: 'hard', subjectId: 's3', subjectName: '工程经济', year: 2023,
  },
  {
    id: 'q48', content: '简述影响基准收益率的因素。',
    type: 'short',
    answer: '影响基准收益率的因素主要包括：1.资金成本：包括资金筹集费和资金占用费；2.机会成本：指投资者将资金用于其他投资所能获得的最大收益；3.投资风险：风险越大，基准收益率应越高；4.通货膨胀：通货膨胀率越高，基准收益率应越高；5.资金限制：资金紧张时，基准收益率可能会提高。',
    analysis: '基准收益率是项目经济评价的重要参数，需要全面考虑各种影响因素。',
    difficulty: 'hard', subjectId: 's3', subjectName: '工程经济', year: 2024,
  },

  // 建筑工程实务 - 选择题
  {
    id: 'q49', content: '混凝土强度等级C30中的30表示（）。',
    type: 'choice', options: [
      { label: 'A', content: '抗压强度标准值为30MPa' },
      { label: 'B', content: '抗拉强度标准值为30MPa' },
      { label: 'C', content: '抗压强度设计值为30MPa' },
      { label: 'D', content: '抗折强度标准值为30MPa' },
    ],
    answer: 'A', analysis: '混凝土强度等级C30中的30表示立方体抗压强度标准值为30MPa，即按标准方法制作和养护的边长为150mm的立方体试件，在28天龄期用标准试验方法测得的具有95%保证率的抗压强度值。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务', year: 2023,
  },
  {
    id: 'q50', content: '下列关于模板拆除顺序的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '先支的先拆，后支的后拆' },
      { label: 'B', content: '先支的后拆，后支的先拆' },
      { label: 'C', content: '同时拆除' },
      { label: 'D', content: '随意拆除' },
    ],
    answer: 'B', analysis: '模板拆除应遵循"先支的后拆，后支的先拆"的原则，即先拆除非承重模板，后拆除承重模板，确保结构安全。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务', year: 2022,
  },
  {
    id: 'q51', content: '大体积混凝土施工时，为控制温度裂缝，应采取的措施不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '选用低水化热水泥' },
      { label: 'B', content: '掺加粉煤灰等掺合料' },
      { label: 'C', content: '加快浇筑速度，缩短浇筑时间' },
      { label: 'D', content: '埋设冷却水管进行降温' },
    ],
    answer: 'C', analysis: '大体积混凝土温控措施包括：选用低水化热水泥、掺加粉煤灰减少水泥用量、埋设冷却水管、表面保温养护等。加快浇筑速度不利于散热，反而可能增加温度应力。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务', year: 2024,
  },
  {
    id: 'q52', content: '钢筋连接方式中，不宜用于承受动力荷载的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '绑扎连接' },
      { label: 'B', content: '机械连接' },
      { label: 'C', content: '焊接连接' },
      { label: 'D', content: '套筒挤压连接' },
    ],
    answer: 'C', analysis: '焊接连接在承受动力荷载时容易产生疲劳破坏，因此不宜用于承受动力荷载的钢筋连接。机械连接和套筒挤压连接性能较好，可用于各种荷载条件。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务', year: 2023,
  },
  {
    id: 'q53', content: '下列关于砌体结构的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '砌体结构耐久性好' },
      { label: 'B', content: '砌体结构耐火性好' },
      { label: 'C', content: '砌体结构抗震性能好' },
      { label: 'D', content: '砌体结构施工方便' },
    ],
    answer: 'C', analysis: '砌体结构的优点包括耐久性好、耐火性好、施工方便、造价较低等。但其缺点是抗震性能较差，自重大，整体性不如混凝土结构。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务', year: 2022,
  },
  {
    id: 'q54', content: '屋面防水等级分为（）级。',
    type: 'choice', options: [
      { label: 'A', content: '2' },
      { label: 'B', content: '3' },
      { label: 'C', content: '4' },
      { label: 'D', content: '5' },
    ],
    answer: 'A', analysis: '根据《屋面工程技术规范》GB 50345-2012，屋面防水等级分为Ⅰ级和Ⅱ级。Ⅰ级防水要求更高，适用于重要建筑和高层建筑。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务', year: 2024,
  },
  {
    id: 'q55', content: '下列关于土方开挖的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '土方开挖应遵循"先撑后挖，分层开挖"的原则' },
      { label: 'B', content: '土方开挖可以一次挖到设计标高' },
      { label: 'C', content: '土方开挖不需要考虑边坡稳定性' },
      { label: 'D', content: '土方开挖应从低处向高处进行' },
    ],
    answer: 'A', analysis: '土方开挖应遵循"先撑后挖，分层开挖"的原则，严禁超挖，严禁在未支护的情况下进行下层土方开挖。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务', year: 2023,
  },
  {
    id: 'q56', content: '脚手架搭设高度超过（）时，需要编制专项施工方案并进行专家论证。',
    type: 'choice', options: [
      { label: 'A', content: '24m' },
      { label: 'B', content: '36m' },
      { label: 'C', content: '50m' },
      { label: 'D', content: '60m' },
    ],
    answer: 'C', analysis: '根据住建部相关规定，搭设高度超过50m的落地式钢管脚手架工程，需要编制专项施工方案并进行专家论证。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务', year: 2021,
  },
  {
    id: 'q57', content: '下列关于预应力混凝土的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '预应力混凝土可以提高构件的抗裂性能' },
      { label: 'B', content: '预应力混凝土不需要配置普通钢筋' },
      { label: 'C', content: '预应力混凝土只能用于桥梁工程' },
      { label: 'D', content: '预应力混凝土的施工工艺简单' },
    ],
    answer: 'A', analysis: '预应力混凝土通过预先施加压应力，可以抵消使用阶段产生的拉应力，从而提高构件的抗裂性能和刚度。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务', year: 2024,
  },
  {
    id: 'q58', content: '混凝土浇筑时，自由下落高度不宜超过（）。',
    type: 'choice', options: [
      { label: 'A', content: '1m' },
      { label: 'B', content: '2m' },
      { label: 'C', content: '3m' },
      { label: 'D', content: '4m' },
    ],
    answer: 'B', analysis: '混凝土浇筑时，自由下落高度不宜超过2m，超过时应采用串筒、溜管等措施，防止混凝土离析。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务', year: 2022,
  },
  // 建筑工程实务 - 判断题
  {
    id: 'q59', content: '钢筋混凝土地梁的主要作用是承受上部墙体传来的荷载并传递给基础。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '地梁（基础梁）的主要作用确实是承受上部墙体传来的荷载，并将其均匀传递给基础，同时还有增强基础整体性的作用。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务', year: 2023,
  },
  {
    id: 'q60', content: '混凝土养护时间不应少于7天。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据相关规范，混凝土养护时间不应少于7天，对于掺用缓凝型外加剂或有抗渗要求的混凝土，养护时间不应少于14天。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务', year: 2022,
  },
  {
    id: 'q61', content: '屋面防水施工时，应先做女儿墙和泛水，后做屋面防水层。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '屋面防水施工时，应先做屋面防水层，后做女儿墙和泛水，确保泛水收头牢固可靠。',
    difficulty: 'medium', subjectId: 's4', subjectName: '建筑工程实务', year: 2024,
  },
  {
    id: 'q62', content: '钢筋的屈服强度是钢筋力学性能的重要指标。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '钢筋的屈服强度是钢筋力学性能的重要指标，是设计和施工中选用钢筋的重要依据。',
    difficulty: 'easy', subjectId: 's4', subjectName: '建筑工程实务', year: 2023,
  },
  // 建筑工程实务 - 简答题
  {
    id: 'q63', content: '简述混凝土浇筑的基本要求。',
    type: 'short',
    answer: '混凝土浇筑的基本要求：1.浇筑前应检查模板、钢筋、预埋件等是否符合要求；2.混凝土应分层浇筑，每层厚度不超过振捣棒作用长度的1.25倍；3.浇筑应连续进行，如需间歇，间歇时间不应超过混凝土初凝时间；4.混凝土自由下落高度不应超过2m，超过时应采用串筒、溜管等措施；5.振捣应密实，不得漏振、过振；6.浇筑完毕后应及时养护。',
    analysis: '混凝土浇筑是施工中的关键工序，需要掌握各项技术要求。',
    difficulty: 'hard', subjectId: 's4', subjectName: '建筑工程实务', year: 2023,
  },
  {
    id: 'q64', content: '简述钢筋连接的主要方式及其适用范围。',
    type: 'short',
    answer: '钢筋连接的主要方式包括：1.绑扎连接：适用于直径较小的钢筋，受力性能较差，不宜用于承受动力荷载；2.焊接连接：包括闪光对焊、电弧焊等，适用于各种直径的钢筋，但焊接质量受操作水平影响较大；3.机械连接：包括套筒挤压连接、螺纹套筒连接等，受力性能好，适用于各种直径的钢筋，尤其适用于承受动力荷载的结构；4.套筒灌浆连接：适用于预制装配结构中的钢筋连接。',
    analysis: '钢筋连接方式的选择应根据钢筋直径、受力情况、施工条件等因素综合考虑。',
    difficulty: 'hard', subjectId: 's4', subjectName: '建筑工程实务', year: 2024,
  },

  // 安全管理 - 选择题
  {
    id: 'q65', content: '建筑施工企业安全生产许可证的有效期为（）。',
    type: 'choice', options: [
      { label: 'A', content: '1年' },
      { label: 'B', content: '2年' },
      { label: 'C', content: '3年' },
      { label: 'D', content: '5年' },
    ],
    answer: 'C', analysis: '根据《安全生产许可证条例》规定，安全生产许可证的有效期为3年。有效期满需要延期的，应当于期满前3个月向原发证机关办理延期手续。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2023,
  },
  {
    id: 'q66', content: '高处作业是指在坠落高度基准面（）m及以上有可能坠落的高处进行的作业。',
    type: 'choice', options: [
      { label: 'A', content: '1.5' },
      { label: 'B', content: '2' },
      { label: 'C', content: '2.5' },
      { label: 'D', content: '3' },
    ],
    answer: 'B', analysis: '根据国家标准GB/T 3608-2008《高处作业分级》规定，高处作业是指在坠落高度基准面2m及以上有可能坠落的高处进行的作业。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2022,
  },
  {
    id: 'q67', content: '基坑开挖深度超过（）时，应编制专项施工方案。',
    type: 'choice', options: [
      { label: 'A', content: '2m' },
      { label: 'B', content: '3m' },
      { label: 'C', content: '5m' },
      { label: 'D', content: '8m' },
    ],
    answer: 'B', analysis: '根据住建部相关规定，基坑开挖深度超过3m（含3m）或虽未超过3m但地质条件和周边环境复杂的基坑支护工程，需要编制专项施工方案。',
    difficulty: 'medium', subjectId: 's5', subjectName: '安全管理', year: 2024,
  },
  {
    id: 'q68', content: '下列关于脚手架搭设的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '脚手架立杆可以悬空' },
      { label: 'B', content: '脚手架搭设不需要设置扫地杆' },
      { label: 'C', content: '脚手架搭设应符合相关规范要求' },
      { label: 'D', content: '脚手架可以超载使用' },
    ],
    answer: 'C', analysis: '脚手架搭设必须符合相关规范要求，立杆底部应设置底座或垫板，必须设置扫地杆，严禁超载使用。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2023,
  },
  {
    id: 'q69', content: '施工现场临时用电采用（）级配电系统。',
    type: 'choice', options: [
      { label: 'A', content: '1' },
      { label: 'B', content: '2' },
      { label: 'C', content: '3' },
      { label: 'D', content: '4' },
    ],
    answer: 'C', analysis: '施工现场临时用电应采用三级配电系统，即总配电箱、分配电箱、开关箱三级配电。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2022,
  },
  {
    id: 'q70', content: '下列关于塔吊安装的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '塔吊安装必须由具备资质的单位进行' },
      { label: 'B', content: '塔吊安装前应编制专项施工方案' },
      { label: 'C', content: '塔吊安装完成后不需要验收' },
      { label: 'D', content: '塔吊安装人员必须持证上岗' },
    ],
    answer: 'C', analysis: '塔吊安装完成后必须进行验收，验收合格后方可使用。验收内容包括基础、塔身、起重臂、平衡臂、安全装置等。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2024,
  },
  {
    id: 'q71', content: '下列关于临边防护的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '临边防护栏杆高度不应低于1.0m' },
      { label: 'B', content: '临边防护栏杆应设置上下两道横杆' },
      { label: 'C', content: '临边防护不需要设置挡脚板' },
      { label: 'D', content: '临边防护可以使用竹笆等材料' },
    ],
    answer: 'B', analysis: '临边防护栏杆高度不应低于1.2m，应设置上下两道横杆，下杆离地高度为0.6m，上杆离地高度为1.2m，同时应设置挡脚板。',
    difficulty: 'medium', subjectId: 's5', subjectName: '安全管理', year: 2023,
  },
  {
    id: 'q72', content: '施工现场的"四口"不包括（）。',
    type: 'choice', options: [
      { label: 'A', content: '楼梯口' },
      { label: 'B', content: '电梯井口' },
      { label: 'C', content: '通道口' },
      { label: 'D', content: '大门口' },
    ],
    answer: 'D', analysis: '施工现场的"四口"是指：楼梯口、电梯井口、通道口、预留洞口。大门口不属于"四口"范畴。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2021,
  },
  {
    id: 'q73', content: '下列关于安全技术交底的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '安全技术交底只需要口头交底' },
      { label: 'B', content: '安全技术交底不需要签字确认' },
      { label: 'C', content: '安全技术交底应逐级进行' },
      { label: 'D', content: '安全技术交底可以代替安全教育' },
    ],
    answer: 'C', analysis: '安全技术交底应逐级进行，从项目经理到班组长，再到作业人员，交底内容应具体明确，并签字确认。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2024,
  },
  {
    id: 'q74', content: '下列关于消防器材配置的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '消防器材可以随意放置' },
      { label: 'B', content: '消防器材不需要定期检查' },
      { label: 'C', content: '消防器材应设置在明显易取的位置' },
      { label: 'D', content: '消防器材可以挪用' },
    ],
    answer: 'C', analysis: '消防器材应设置在明显易取的位置，定期检查和维护，严禁挪用和损坏。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2022,
  },
  // 安全管理 - 判断题
  {
    id: 'q75', content: '施工现场的"三宝"是指安全帽、安全带和安全网。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '施工现场"三宝"确实是指安全帽、安全带和安全网，这是建筑施工中最基本的安全防护用品。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2023,
  },
  {
    id: 'q76', content: '施工现场临时用电必须采用TN-S系统。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '施工现场临时用电必须采用TN-S系统，即三相五线制，确保用电安全。',
    difficulty: 'medium', subjectId: 's5', subjectName: '安全管理', year: 2022,
  },
  {
    id: 'q77', content: '高处作业时，必须佩戴安全带。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据相关规定，高处作业时必须佩戴安全带，安全带应高挂低用，确保安全。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2024,
  },
  {
    id: 'q78', content: '施工单位可以在未进行安全技术交底的情况下安排工人作业。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '根据相关规定，施工单位必须在进行安全技术交底后才能安排工人作业，未经交底不得上岗。',
    difficulty: 'easy', subjectId: 's5', subjectName: '安全管理', year: 2023,
  },
  // 安全管理 - 简答题
  {
    id: 'q79', content: '简述施工现场安全检查的主要内容。',
    type: 'short',
    answer: '施工现场安全检查的主要内容包括：1.安全生产责任制落实情况；2.施工组织设计及专项方案的编制审批情况；3.安全技术交底情况；4.安全教育培训情况；5.安全防护设施（临边洞口防护、脚手架、模板支撑等）；6.施工用电安全；7.起重机械及垂直运输设备安全；8.消防安全；9.文明施工；10.劳动防护用品使用情况。',
    analysis: '安全检查是预防事故的重要手段，需要全面覆盖各个方面。',
    difficulty: 'hard', subjectId: 's5', subjectName: '安全管理', year: 2023,
  },
  {
    id: 'q80', content: '简述建筑施工中"三违"行为的具体内容。',
    type: 'short',
    answer: '建筑施工中的"三违"行为包括：1.违章指挥：指管理人员违反安全规章制度，强令工人冒险作业；2.违章作业：指作业人员违反安全操作规程进行作业；3.违反劳动纪律：指作业人员违反劳动纪律，如迟到早退、酒后作业、擅自离岗等。"三违"行为是导致事故的重要原因，必须坚决制止。',
    analysis: '"三违"行为是安全管理的重点整治对象，需要明确界定并严格管理。',
    difficulty: 'hard', subjectId: 's5', subjectName: '安全管理', year: 2024,
  },

  // 质量管理 - 选择题
  {
    id: 'q81', content: 'PDCA循环中的D代表（）。',
    type: 'choice', options: [
      { label: 'A', content: '设计（Design）' },
      { label: 'B', content: '执行（Do）' },
      { label: 'C', content: '检查（Detect）' },
      { label: 'D', content: '交付（Deliver）' },
    ],
    answer: 'B', analysis: 'PDCA循环中，P=Plan（计划）、D=Do（执行）、C=Check（检查）、A=Act（处理），是质量管理的基本工作方法。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2023,
  },
  {
    id: 'q82', content: '混凝土结构实体检验中，回弹法属于（）。',
    type: 'choice', options: [
      { label: 'A', content: '破损检测方法' },
      { label: 'B', content: '非破损检测方法' },
      { label: 'C', content: '半破损检测方法' },
      { label: 'D', content: '取样检测方法' },
    ],
    answer: 'B', analysis: '回弹法是一种非破损检测方法，通过测量混凝土表面的回弹值来推定混凝土的抗压强度，不会对结构造成损伤。',
    difficulty: 'medium', subjectId: 's6', subjectName: '质量管理', year: 2022,
  },
  {
    id: 'q83', content: '隐蔽工程在隐蔽前，应由（）通知有关单位进行验收。',
    type: 'choice', options: [
      { label: 'A', content: '建设单位' },
      { label: 'B', content: '施工单位' },
      { label: 'C', content: '监理单位' },
      { label: 'D', content: '设计单位' },
    ],
    answer: 'B', analysis: '根据相关规定，隐蔽工程在隐蔽前，施工单位应通知监理单位（建设单位）进行验收，并形成验收文件，验收合格后方可进行下一道工序施工。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2024,
  },
  {
    id: 'q84', content: '下列关于工程质量验收的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '工程质量验收只需要施工单位自检' },
      { label: 'B', content: '工程质量验收不需要监理单位参与' },
      { label: 'C', content: '工程质量验收应按照规定的程序进行' },
      { label: 'D', content: '工程质量验收可以随意简化程序' },
    ],
    answer: 'C', analysis: '工程质量验收必须按照规定的程序进行，包括施工单位自检、监理单位验收、建设单位组织验收等环节，严禁简化程序。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2023,
  },
  {
    id: 'q85', content: '工程质量事故按严重程度分为（）个等级。',
    type: 'choice', options: [
      { label: 'A', content: '2' },
      { label: 'B', content: '3' },
      { label: 'C', content: '4' },
      { label: 'D', content: '5' },
    ],
    answer: 'C', analysis: '工程质量事故按严重程度分为四个等级：特别重大事故、重大事故、较大事故和一般事故。',
    difficulty: 'medium', subjectId: 's6', subjectName: '质量管理', year: 2022,
  },
  {
    id: 'q86', content: '下列关于质量控制点的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '质量控制点不需要设置检验程序' },
      { label: 'B', content: '质量控制点是施工质量的薄弱环节或关键部位' },
      { label: 'C', content: '质量控制点只需要施工单位自检' },
      { label: 'D', content: '质量控制点可以随意取消' },
    ],
    answer: 'B', analysis: '质量控制点是指施工质量的薄弱环节或关键部位，需要设置专门的检验程序，确保质量符合要求。',
    difficulty: 'medium', subjectId: 's6', subjectName: '质量管理', year: 2024,
  },
  {
    id: 'q87', content: '下列关于工程质量保修的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '工程质量保修期限由施工单位确定' },
      { label: 'B', content: '基础设施工程的保修期限为设计文件规定的该工程的合理使用年限' },
      { label: 'C', content: '工程质量保修金可以不返还' },
      { label: 'D', content: '工程质量保修不需要签订保修书' },
    ],
    answer: 'B', analysis: '根据《建设工程质量管理条例》规定，基础设施工程、房屋建筑的地基基础工程和主体结构工程，为设计文件规定的该工程的合理使用年限。',
    difficulty: 'medium', subjectId: 's6', subjectName: '质量管理', year: 2023,
  },
  {
    id: 'q88', content: '工程质量检验批的验收应由（）组织。',
    type: 'choice', options: [
      { label: 'A', content: '建设单位' },
      { label: 'B', content: '监理工程师' },
      { label: 'C', content: '施工单位技术负责人' },
      { label: 'D', content: '设计单位' },
    ],
    answer: 'B', analysis: '根据相关规定，检验批应由监理工程师（建设单位项目技术负责人）组织施工单位项目专业质量检验员等进行验收。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2021,
  },
  {
    id: 'q89', content: '下列关于工程质量检测的说法，不正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '工程质量检测机构必须具备相应的资质' },
      { label: 'B', content: '工程质量检测报告必须加盖检测机构公章' },
      { label: 'C', content: '工程质量检测可以由施工单位自行进行' },
      { label: 'D', content: '工程质量检测结果应真实准确' },
    ],
    answer: 'C', analysis: '工程质量检测必须由具备相应资质的检测机构进行，施工单位不能自行进行检测。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2024,
  },
  {
    id: 'q90', content: '下列关于质量事故处理的说法，正确的是（）。',
    type: 'choice', options: [
      { label: 'A', content: '质量事故处理不需要制定处理方案' },
      { label: 'B', content: '质量事故处理完成后不需要验收' },
      { label: 'C', content: '质量事故处理应坚持"三不放过"原则' },
      { label: 'D', content: '质量事故处理可以隐瞒不报' },
    ],
    answer: 'C', analysis: '质量事故处理应坚持"三不放过"原则：事故原因不清楚不放过、事故责任者和群众没有受到教育不放过、没有制定防范措施不放过。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2022,
  },
  // 质量管理 - 判断题
  {
    id: 'q91', content: '工程质量事故按严重程度分为一般事故和重大事故两个等级。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: '工程质量事故按严重程度分为四个等级：特别重大事故、重大事故、较大事故和一般事故。',
    difficulty: 'medium', subjectId: 's6', subjectName: '质量管理', year: 2023,
  },
  {
    id: 'q92', content: '隐蔽工程在隐蔽前，施工单位应通知监理单位进行验收。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据相关规定，隐蔽工程在隐蔽前，施工单位应通知监理单位（建设单位）进行验收，并形成验收文件，验收合格后方可进行下一道工序施工。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2022,
  },
  {
    id: 'q93', content: '质量管理的PDCA循环中，A代表"检查"。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'B', analysis: 'PDCA循环中，A代表"处理"（Act），而非"检查"。检查是C（Check）。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2024,
  },
  {
    id: 'q94', content: '工程质量保修期限不得低于法定最低保修期限。',
    type: 'judge', options: [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ],
    answer: 'A', analysis: '根据相关规定，建设工程的最低保修期限不得低于法定规定的期限，发承包双方可以约定更长的保修期限。',
    difficulty: 'easy', subjectId: 's6', subjectName: '质量管理', year: 2023,
  },
  // 质量管理 - 简答题
  {
    id: 'q95', content: '简述建筑工程质量验收的层次划分。',
    type: 'short',
    answer: '建筑工程质量验收分为四个层次：1.检验批：按同一生产条件或规定方式汇总起来的由一定数量样本组成的检验体；2.分项工程：按主要工种、材料、施工工艺等划分；3.分部工程：按专业性质、建筑部位确定；4.单位工程：具备独立施工条件并能形成独立使用功能的建筑物或构筑物。验收顺序为：检验批→分项工程→分部工程→单位工程。',
    analysis: '质量验收层次是工程质量管理的核心知识点。',
    difficulty: 'hard', subjectId: 's6', subjectName: '质量管理', year: 2023,
  },
  {
    id: 'q96', content: '简述工程质量事故处理的一般程序。',
    type: 'short',
    answer: '工程质量事故处理的一般程序包括：1.事故报告：及时向建设单位和有关部门报告；2.事故调查：组织调查小组，查明事故原因、性质、损失等；3.事故原因分析：分析事故发生的直接原因和间接原因；4.制定处理方案：根据事故情况制定合理的处理方案；5.事故处理：按照处理方案进行处理；6.事故处理验收：对处理结果进行验收；7.提交处理报告：总结事故处理过程和结果。',
    analysis: '工程质量事故处理程序是质量管理的重要内容，需要掌握各个环节。',
    difficulty: 'hard', subjectId: 's6', subjectName: '质量管理', year: 2024,
  },
];

subjects.forEach((subject) => {
  subject.questionCount = questions.filter((q) => q.subjectId === subject.id).length;
});

export const answerRecords: AnswerRecord[] = [];

export const favoriteRecords: FavoriteRecord[] = [];