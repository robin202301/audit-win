# Windows 部署特别注意事项

## 原生模块兼容性

### 1. SQLite3 模块
AuditSystem-Win 使用 `sqlite3` 原生模块，需要特别注意：

**构建要求**:
- **Windows Build Tools**: 必须安装
- **Python 2.7/3.x**: 用于 node-gyp 编译
- **Visual Studio 2019/2022**: 包含 Windows SDK

**安装命令**:
```bash
# 方法1: 使用管理员 PowerShell
npm install --global windows-build-tools

# 方法2: 手动安装
npm install --vs2019
```

**打包配置**:
```json
{
  "nodeGypRebuild": true,
  "npmRebuild": true,
  "asarUnpack": [
    "**/*.node",
    "**/sqlite3/**"  // 必须解压 sqlite3 原生模块
  ]
}
```

### 2. 32位 vs 64位系统
- **默认目标**: x64 (64位)
- **32位支持**: 需要额外配置 `--ia32` 参数
- **ARM 支持**: 目前不支持 Windows ARM 版本

## Windows 安全特性

### 1. 用户账户控制 (UAC)
- **安装时需要**: 管理员权限
- **运行时建议**: 标准用户权限
- **注册表写入**: 需要管理员权限

**缓解措施**:
- 将配置存储在 `%APPDATA%` 而不是 `Program Files`
- 使用 `app.requestSingleInstanceLock()` 防止多实例冲突

### 2. Windows Defender 和杀毒软件
**常见误报原因**:
- Electron 应用打包模式
- SQLite 数据库文件操作
- 文件系统监控行为

**解决方案**:
1. **代码签名**: 使用有效证书签名
2. **提交误报**: 向杀毒软件厂商提交样本
3. **用户指导**: 提供添加例外的说明

### 3. 数字签名（强烈推荐）
对于企业部署，必须进行数字签名：

```bash
# 设置签名环境变量
set CSC_LINK=path\to\certificate.pfx
set CSC_KEY_PASSWORD=your_password
set CSC_NAME="Your Company Name"

# 打包并签名
npm run electron:build
```

**证书要求**:
- EV Code Signing Certificate（扩展验证）
- 时间戳服务 URL
- 有效的信任链

## 安装程序行为

### 1. NSIS 安装程序配置
```json
{
  "nsis": {
    "oneClick": false,  // 显示安装向导
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "menuCategory": "KQQ Audit System"
  }
}
```

### 2. 静默安装（企业部署）
```bash
# 静默安装
KQQ-Audit-System-Setup-x.x.x.exe /S

# 指定安装目录
KQQ-Audit-System-Setup-x.x.x.exe /S /D=C:\AuditSystem

# 不创建快捷方式
KQQ-Audit-Setup-x.x.x.exe /S /NOCLOSE /NORESTART
```

### 3. 卸载行为
- **保留用户数据**: 默认保留 `%APPDATA%` 数据
- **完整卸载**: 使用控制面板或卸载程序
- **静默卸载**: `Uninstall.exe /S`

## 文件系统和权限

### 1. 应用程序目录结构
```
# 安装目录（只读）
C:\Program Files\KQQ-Audit-System\
  ├── KQQ-Audit-System.exe
  ├── resources/
  │   └── templates/          # Word模板
  └── node_modules/           # 依赖模块

# 用户数据目录（读写）
%APPDATA%\KQQ-Audit-System\
  ├── audit.db               # SQLite数据库
  ├── config.json            # 配置文件
  └── logs/                  # 日志文件

# 用户文档目录
%USERPROFILE%\Documents\KQQ-Audit-System\
  ├── Projects/              # 项目文件
  ├── Exports/               # 导出文档
  └── Templates/             # 用户自定义模板
```

### 2. 权限问题排查
**问题**: "权限被拒绝" 错误
**检查步骤**:
1. 检查目标目录是否只读
2. 验证当前用户是否有写入权限
3. 检查防病毒软件是否阻止访问

**解决方案**:
```javascript
// 在代码中处理权限错误
try {
  await fs.writeFile(filePath, data)
} catch (error) {
  if (error.code === 'EPERM') {
    // 提示用户检查权限
    dialog.showErrorBox('权限错误', '请检查文件访问权限')
  }
}
```

## Windows 版本兼容性

### 支持矩阵
| Windows 版本 | 支持状态 | 备注 |
|-------------|---------|------|
| Windows 11  | ✅ 完全支持 | 推荐版本 |
| Windows 10  | ✅ 完全支持 | 最低版本 1809 |
| Windows 8.1 | ⚠️ 有限支持 | 可能需要额外运行库 |
| Windows 7   | ⚠️ 有限支持 | 不再接收安全更新 |
| Windows Server | ❌ 不支持 | 未测试 |

### 已知问题
1. **Windows 7**: 需要手动安装 .NET Framework 4.8 和 VC++ 运行库
2. **Windows 8.1**: 高DPI显示可能有缩放问题
3. **Windows N/KN 版本**: 缺少媒体功能包，可能影响某些功能

## 性能和优化

### 1. 启动性能
**优化措施**:
- 使用 `app.commandLine.appendSwitch('disable-gpu')` 禁用GPU（如需要）
- 启用代码分割和懒加载
- 减少主进程初始化时间

### 2. 内存管理
**监控指标**:
- 主进程内存使用
- 渲染进程内存使用
- SQLite 数据库连接池

**优化建议**:
```javascript
// 定期清理
setInterval(() => {
  if (global.gc) global.gc()
}, 30 * 60 * 1000) // 每30分钟
```

### 3. 数据库性能
- 使用 WAL 模式提高并发性能
- 定期执行 `VACUUM` 优化数据库
- 启用适当的索引

## 更新和维护

### 1. 自动更新
```json
{
  "publish": {
    "provider": "generic",
    "url": "https://download.example.com/updates"
  }
}
```

### 2. 手动更新
1. 下载新版本安装程序
2. 运行安装程序覆盖旧版本
3. 用户数据会自动迁移

### 3. 回滚策略
**保留旧版本**:
- 安装时保留上一个版本
- 提供版本切换功能
- 备份关键配置

## 故障排除

### 1. 事件查看器日志
检查 Windows 事件查看器获取详细错误信息：
```
事件查看器 → Windows 日志 → 应用程序
```

### 2. 应用程序日志
位置: `%APPDATA%\KQQ-Audit-System\logs\`

### 3. 常见错误代码
- **0x80070005**: 权限拒绝
- **0x80004005**: 一般性错误（通常是依赖问题）
- **0x80070002**: 文件未找到

### 4. 调试模式
```bash
# 启用调试日志
KQQ-Audit-System.exe --debug --log-level=debug

# 启用开发者工具
KQQ-Audit-System.exe --dev-tools
```

## 企业部署建议

### 1. Group Policy 部署
1. 创建 MSI 包（使用 electron-builder）
2. 通过 Active Directory 分发
3. 配置安装参数

### 2. SCCM/Intune 部署
- 打包为 `.intunewin` 格式
- 配置检测规则
- 设置依赖关系

### 3. 网络隔离环境
**离线安装包**:
```bash
# 创建包含所有依赖的安装包
npm run electron:build -- --win --x64 --dir

# 然后将 dist/win-unpacked 目录打包
```

**依赖项清单**:
- VC++ Redistributable 2015-2022
- .NET Framework 4.8
- Windows 更新 KB2999226（Windows 7）

## 安全建议

### 1. 数据加密
- 使用 SQLCipher 加密数据库
- 配置文件加密存储
- 敏感数据内存清理

### 2. 输入验证
- 验证所有用户输入
- 防止路径遍历攻击
- 限制文件操作权限

### 3. 审计日志
- 记录所有关键操作
- 防止日志篡改
- 定期归档日志

---
*最后更新: 2026-04-16*
*适用于 AuditSystem-Win v0.1.0*