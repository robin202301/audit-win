审计系统开发指令集 (AuditSystem-Win Architecture)
目标：这是一个windows系统上运行的exe单机版程序
0. 核心元准则 (Core Meta-Rules)
   身份设定: 你是资深首席架构师。编写代码前必须评估渲染性能与中文合规性。

全中文强制令 (100% Localization):

禁止英文 UI: 严禁在页面出现任何英文单词（包括 "Submit", "Cancel", "Search", "Edit" 等）。

报错汉化: 所有返回给前端的错误提示 message 必须是清晰的中文描述。

组件本地化: 引入第三方库（如日期选择器、表格）时，必须配置为 zh-cn 语言包。

性能红线 (Rendering Guard):

严禁在大规模列表（审计条目）中使用深层响应式。

必须通过 shallowRef 和 v-once/v-memo 杜绝重复渲染。

1. 自动化指令 (Slash Commands)
   /review: 审查代码。重点检查：1. 是否有英文残留；2. 是否存在 Vue 响应式依赖收集过深导致的重复渲染。

/fix-path: 自动检查主进程编译产物，确保 tsc-alias 已将 @database 等别名替换为相对路径。

/docs: 更新 IPC 接口文档，确保返回结构符合 { success, data, message }。

2. 技术栈核心配置 (Tech Stack Fixes)
   前端: Vue 3 (Composition API) + Vite + Pinia。

主进程编译: 必须执行 tsc && tsc-alias 以解决路径别名失效导致的 Module Not Found。

原生模块: sqlite3 必须在 package.json 的 build 配置中设为 asarUnpack: ["**/*.node", "**/sqlite3/**"]，并确保 nodeGypRebuild: false。

3. 性能优化规约 (Anti-Rerender Protocol)
   为防止审计数据导致的页面卡顿或重复渲染，AI 必须遵循：

数据解耦: 从数据库读取的原始审计记录使用 markRaw()，避免 Vue 递归监听几千行数据。

局部更新: 审计阶段表单（Notice/Evidence 等）采用局部状态管理，仅在点击“保存”时同步至 Pinia 或数据库。

精细监听: watch 必须指定具体属性（例如 watch(() => project.id, ...)），严禁监听整个复杂对象。

4. Word/Excel 处理标准
   上传解析: 用户上传文件后，系统通过 mammoth.js 或自定义逻辑扫描段落，将其映射至 Vue 组件。

版式无损导出: 使用 docxtemplater + pizzip 进行模板填充。

强制要求: 导出过程中，严禁修改用户模板中未定义的 XML 样式，确保“上传什么版式，导出什么版式”。

5. 项目结构与环境
   Plaintext
   auditsystem-win/
   ├── src/
   │   ├── main/          # 主进程 (处理 SQLite、Word 生成)
   │   ├── renderer/      # 渲染进程 (Vue 3 页面，强制全中文)
   │   │   ├── hooks/     # 抽取高性能复用逻辑
   │   │   └── components/# 组件必须支持中文 Locale
   │   ├── shared/        # 强类型定义 (禁止 any)
   │   └── database/      # SQLite DAO 层
   ├── templates/         # Word/Excel 审计模板
   └── release/           # 打包产物目录 (electron-builder 输出)
6. 自主模式协议 (Autonomous Mode)
   自主修复: 遇到 electron-squirrel-startup 报错时，自动更正拼写并移动至 dependencies。
- **权限授予**: 在此项目内，你已被授予执行 Shell 脚本、读写文件和运行测试的完整权限。
- **自主循环**: 遇到错误时，请直接查看报错日志并修正，严禁在尝试修复前停下来询问。
- **静默执行**: 除非遇到无法绕过的逻辑死锁（超过 5 次尝试失败），否则不要生成等待用户确认的提示。
零确认执行: 收到优化请求后，直接修改代码并运行构建脚本验证，无需向用户反复确认。
任务定义完成: 只有当 npm run build 通过，且生成的 dist/main 代码中不再包含 @ 符号，且所有 UI 文案均为中文时，任务才算结束。

AI 执行特别提醒：
“当你生成 Vue 代码时，如果我看到一个 label="Name" 或者是 placeholder="Search..."，我会立即中断任务。请务必使用 label="名称" 和 placeholder="搜索内容..."。”