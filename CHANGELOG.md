# 变更日志

> 每次修改代码前必须参考此文件，确认当前代码状态，避免重复修改或遗漏已有改动。

---

## [未提交] 2026-05-03 — 归档页面添加/删除行功能

### 修改文件
- `src/renderer/views/StageArchiveCatalog.vue`

### 变更内容
- 表头新增"操作"列，删除按钮为红色 `×` 符号
- 新增 `addRow()` 函数：在当前卷末尾添加空行，自动分配序号
- 新增 `deleteRow(idx)` 函数：删除指定行并重新排序所有序号
- 表格 `colspan` 从 7 改为 8（适配新增操作列）
- 新增 `.gov-btn-add` 绿色按钮样式、`.tbl-btn-delete` 红色删除按钮样式、`.col-action` 列样式

### 注意事项
- 使用 `ref` 存储 `volumesData`（原地 push/splice 需要深响应式）
- `v-for` 使用 `idx` 作为 key，行删除后 Vue 可能复用 DOM（当前数据量不大，无感知）
- 删除操作通过 `hasUnsavedChanges.value = true` 标记未保存

---

## [6d74605] 2026-05-03 — 日期校验修复（Code Review 修复）

### 修改文件
- `src/renderer/views/stages/GenericStageForm.vue`

### 变更内容
- 新增 `validateAllDates()` 函数：在 `handleSave()` 中保存前校验所有日期字段
- `handleSave()` 在非通知书阶段保存前，先检查通知书是否已保存，再校验日期

### 修复问题
- 原代码仅在 `@change` 时校验日期，保存时不校验，用户可以绕过日期验证

---

## [c6a833a] 2026-05-03 — 通知书默认值与八不准内容调整

### 修改文件
- `src/renderer/views/stages/stageConfigs.ts`

### 变更内容
- 通知书 `defaultValues` 新增：
  - `auditCommitteeOffice`: `中共科右前旗审计委员会办公室`
  - `auditOrg`: `科右前旗审计局`
  - `content`: `审计"八不准"工作纪律`（仅标题，不含完整八条内容）
- `content` 字段标签从"附件内容"更名为"附件"
- `eight_prohibitions` 的 `content` 默认值从完整八条内容改为仅 `审计"八不准"工作纪律`

---

## [9e357fd] 2026-05-03 — 去除全局配置页面，改为通知书内填写后其他阶段引用

### 修改文件
- `src/renderer/views/Settings.vue`（已删除）
- `src/renderer/main.ts`（移除 `/settings` 路由）
- `src/renderer/views/Home.vue`（移除全局设置按钮）
- `src/database/migrations.ts`（移除 settings 表创建）
- `src/database/repositories/settingsRepo.ts`（已删除）
- `src/main/ipc/index.ts`（移除 settings IPC 处理）
- `src/renderer/types.d.ts`（移除 settings 类型）
- `src/renderer/stores/project.ts`（移除 settings 类型）
- `src/renderer/views/stages/GenericStageForm.vue`（移除全局设置加载逻辑）
- `src/renderer/views/stages/stageConfigs.ts`（移除 `readonly` 属性，通知书字段恢复可编辑）

### 设计决策
- 不使用全局配置页面，通知书中的字段可自由编辑
- 后续阶段通过 `importFrom: ['notice']` 自动导入通知书中已填写的字段

---

## [dbf9099] 2026-05-01 — 归档页面多项修复

### 修改文件
- `src/renderer/views/StageArchiveCatalog.vue`

### 变更内容
- 档案目录导出改为客户端 `xlsx` 库直接生成多 sheet 工作簿（不再依赖服务端模板）
- `init()` 改为 `onMounted(() => { init(); })` 确保组件挂载后再执行
- `autoGenerate()` 新增覆盖确认：已有数据时弹窗询问是否继续
- 导出文件扩展名从 `.xls` 改为 `.xlsx`
- `import` 中移除未使用的 `watch`

---

## [9e357fd] 2026-05-01 — 核心功能：通知书模板动态选择 + 日期校验 + 阶段锁定

### 修改文件
- `src/shared/types.ts`
- `src/renderer/views/stages/stageConfigs.ts`
- `src/renderer/views/stages/GenericStageForm.vue`

### 变更内容

#### 通知书模板动态选择
- `src/shared/types.ts` 新增 `NOTICE_TEMPLATES` 映射：
  - `经济责任审计` → `1经济责任审计通知书`
  - `预算执行审计` → `2预算执行通知书`
  - `专项审计调查` → `3专项审计调查通知书`
- `WORKFLOW_STEPS` 中 `notice` 步骤移除 `template` 字段（改为运行时动态选择）
- `GenericStageForm.vue` 新增 `activeTemplate` 计算属性，根据 `projectInfo.auditType` 选择模板
- `handleExport()` 使用 `activeTemplate.value` 替代 `config.template`

#### 日期校验与阶段锁定
- `GenericStageForm.vue` 新增：
  - `noticeSaveDate` ref：存储通知书的审计开始日期
  - `validateDateField(key)`：校验单个日期字段不能早于通知书日期
  - `checkNoticeSaved()`：检查通知书是否已保存，获取 `auditStartDate`
  - `handleSave()` 重写：非通知书阶段保存前先检查通知书是否已保存

#### 设计文档更新
- `系统设计对照与更新.md` 新增"审计通知书默认值配置"章节

---

## [7b81be3] 2026-04-30 — 首页模糊搜索

### 修改文件
- `src/renderer/views/Home.vue`

### 变更内容
- 首页项目列表支持按名称模糊搜索
- 搜索时显示全部匹配结果，不限制分页

---

## [dbf9099] 2026-05-01 — 删除废弃的独立阶段页面

### 删除文件
- `src/renderer/views/StageNotice.vue`（187行）
- `src/renderer/views/StagePlan.vue`（143行）
- `src/renderer/views/StageReport.vue`（182行）
- `src/renderer/views/StageSurvey.vue`（232行）

### 说明
- 这些独立页面已被 `GenericStageForm.vue` + `stageConfigs.ts` 通用表单替代
- `StageView.vue` 通过 `STAGE_FORM_CONFIGS` 自动路由，不再需要独立页面

---

## [6d74605] 2026-05-01 — 文件查询优化 + 类型修复

### 修改文件
- `src/database/repositories/fileRepo.ts`
- `src/main/ipc/file.ts`
- `src/renderer/views/ProjectDetail.vue`

### 变更内容
- `fileRepo.ts` 新增 `getById(id)` 方法，直接查询单个文件
- `file.ts` 用 `getById` 替换原有的 `getAll().find()`，从 O(N) 优化为 O(1)
- `ProjectDetail.vue` 移除 `as any` 类型断言，改用正确类型

---

## 架构总览（截至 2026-05-03）

### 技术栈
- Electron + TypeScript (主进程)
- Vue 3 Composition API + Vite + Pinia + Vue Router (渲染进程)
- SQLite (better-sqlite3)
- docxtemplater + pizzip (Word模板填充)
- xlsx (客户端Excel生成)

### 审计类型
1. 经济责任审计
2. 预算执行审计
3. 专项审计调查

### 核心文件清单
| 文件 | 职责 |
|------|------|
| `src/shared/types.ts` | 工作流定义、审计类型、NOTICE_TEMPLATES映射 |
| `src/renderer/views/stages/stageConfigs.ts` | 24个阶段表单配置（字段、模板、默认值） |
| `src/renderer/views/stages/GenericStageForm.vue` | 通用阶段表单（自动导入、日期校验、模板导出） |
| `src/renderer/views/StageView.vue` | 阶段路由分发器 |
| `src/renderer/views/StageEvidence.vue` | 取证单1:N管理（专用） |
| `src/renderer/views/StageWorkingPaper.vue` | 底稿1:N管理（专用） |
| `src/renderer/views/StageArchiveCatalog.vue` | 档案目录（自动生成/手动添加删除/多sheet导出） |
| `src/renderer/views/Home.vue` | 项目列表（模糊搜索、新建项目） |
| `src/renderer/views/ProjectDetail.vue` | 项目详情（5阶段Tab、25步骤列表） |
| `src/main/ipc/index.ts` | IPC处理入口（项目、阶段、取证、底稿、调查、模板） |
| `src/main/services/templateService.ts` | 文档生成（Word/Excel模板渲染） |
| `src/database/migrations.ts` | 数据库表结构 + trigger |
