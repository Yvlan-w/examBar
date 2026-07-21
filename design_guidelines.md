# 设计指南 - 职考刷题小程序

## 品牌定位

- **应用定位**：职业资格考试刷题工具，覆盖多科目、多题型
- **设计风格**：专业、简洁、专注，以内容为核心
- **目标用户**：备考职业资格考试的学员

## 配色方案

### 主色板
- **主色** `bg-blue-600` / `text-blue-600`：导航、主按钮、重点标识
- **辅色** `bg-emerald-600` / `text-emerald-600`：正确、完成、通过状态
- **强调色** `bg-amber-600` / `text-amber-600`：考试模式、倒计时、重要提醒

### 中性色
- **背景** `bg-slate-50`：页面底色
- **卡片** `bg-white`：内容容器
- **主文字** `text-slate-800`：标题、正文
- **次文字** `text-slate-500`：说明文字、辅助信息
- **分割线** `border-slate-200`

### 语义色
- **正确** `text-emerald-600` / `bg-emerald-50`
- **错误** `text-red-600` / `bg-red-50`
- **警告** `text-amber-600` / `bg-amber-50`

## 字体规范

- 页面标题：`text-xl font-bold text-slate-800`
- 卡片标题：`text-base font-semibold text-slate-800`
- 正文内容：`text-sm text-slate-600`
- 辅助说明：`text-xs text-slate-400`

## 间距系统

- 页面边距：`px-4`
- 卡片内边距：`p-4`
- 卡片间距：`gap-3` 或 `space-y-3`
- 组件间距：`gap-2`
- 列表项间距：`space-y-2`

## 组件使用原则

- 通用 UI 组件（按钮、输入框、弹窗、Tabs、Toast、Card 等）统一优先使用 `@/components/ui/*`
- 新页面开发前先拆分 UI 单元，映射到组件库已有组件
- 禁止用 View/Text 手搓通用组件

## 导航结构

### TabBar（3 页签）
1. **首页** (`pages/index/index`) - 科目概览 + 刷题模式入口 + 每日推荐
2. **题库** (`pages/questions/index`) - 按科目浏览题目、题型筛选
3. **我的** (`pages/profile/index`) - 做题统计、正确率、历史记录

### 普通页面
- **练习页** (`pages/practice/index`) - 答题界面（选择题/判断题/简答题）
- **考试页** (`pages/exam/index`) - 模拟考试（计时 + 答题卡 + 交卷）
- **结果页** (`pages/result/index`) - 答题/考试结果展示

## 状态展示

- **空状态**：居中图标 + 提示文字，使用 `text-slate-400`
- **加载态**：使用 Skeleton 骨架屏，避免白屏
- **错误态**：柔和红色提示 + 重试按钮
