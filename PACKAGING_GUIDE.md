# AuditSystem-Win 打包和安装指南

## 项目概述

AuditSystem-Win 是一个用于审计工作流管理的桌面应用程序，基于 Electron + Vue 3 + SQLite 技术栈开发，支持 Windows 系统离线运行。

## 系统要求

### 开发环境要求
- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **Windows**: Windows 10/11 (64位)
- **磁盘空间**: 至少 2GB 可用空间

### 目标运行环境
- **Windows**: Windows 7/8/10/11 (64位)
- **内存**: 至少 2GB RAM
- **磁盘空间**: 至少 500MB 可用空间
- **权限**: 管理员权限（安装时）

## 打包前准备工作

### 1. 环境配置
```bash
# 安装所有依赖
npm install

# 安装 electron-builder 全局工具（可选）
npm install -g electron-builder
```

### 2. 模板文件准备
确保所有 Word 模板文件位于 `resources/templates/` 目录中：
```
resources/templates/
├── tpl_audit_notice.docx          # 审计通知模板
├── tpl_audit_evidence.docx        # 审计证据模板
├── tpl_working_paper.docx         # 工作底稿模板
├── tpl_final_report.docx          # 最终报告模板
└── ... (其他模板文件)
```

### 3. 图标文件
确保 `public/icon.ico` 文件存在且格式正确，用于应用程序图标和安装程序图标。

## 打包流程

### 方式一：完整打包（推荐）
```bash
# 执行完整构建和打包
npm run electron:build
```

该命令会：
1. 编译 TypeScript 主进程代码
2. 构建 Vue 渲染进程代码
3. 使用 electron-builder 打包生成安装程序

### 方式二：分步打包
```bash
# 步骤1：构建应用程序
npm run build

# 步骤2：打包生成安装程序
electron-builder --win --x64
```

## 打包配置说明

### 主要配置（package.json）
```json
{
  "build": {
    "appId": "com.kqq.auditsystem",
    "productName": "KQQ-Audit-System",
    "directories": {
      "output": "dist"  // 输出目录
    },
    "files": [
      "dist/**/*",      // 构建后的代码
      "node_modules/**/*",  // 依赖模块
      "templates/**/*"  // 模板目录
    ],
    "extraResources": [
      "resources/templates/**/*"  // 额外资源文件
    ],
    "nodeGypRebuild": true,    // 重建原生模块
    "npmRebuild": true,        // 重建 npm 依赖
    "asar": true,              // 打包为 asar 归档
    "asarUnpack": [            // 需要解压的文件
      "**/*.node",
      "**/sqlite3/**"
    ],
    "win": {
      "target": [
        "nsis",      // 安装程序
        "portable"   // 便携版
      ],
      "icon": "public/icon.ico"
    },
    "nsis": {
      "oneClick": false,                     // 非一键安装
      "allowToChangeInstallationDirectory": true  // 允许选择安装目录
    }
  }
}
```

## 生成的文件

打包完成后，在 `dist/` 目录下会生成：

### 1. 安装程序（推荐）
```
dist/KQQ-Audit-System Setup x.x.x.exe
```
- 标准的 Windows 安装程序
- 包含卸载功能
- 创建开始菜单和桌面快捷方式

### 2. 便携版
```
dist/KQQ-Audit-System x.x.x.exe
```
- 无需安装，直接运行
- 所有文件在同一个目录
- 适合移动设备或临时使用

### 3. 其他文件
- `*.exe.blockmap`: 增量更新文件
- `*.exe.zip`: 压缩版本
- `latest.yml`: 自动更新配置

## Windows 安装注意事项

### 1. 安装前检查
- **杀毒软件**: 可能误报为可疑程序，请添加到信任列表
- **权限**: 需要管理员权限进行安装
- **磁盘空间**: 确保目标驱动器有足够空间（约200MB）

### 2. 安装过程
1. 双击 `KQQ-Audit-System Setup x.x.x.exe`
2. 选择安装语言（默认中文）
3. 阅读并接受许可协议
4. 选择安装目录（默认为 `C:\Program Files\KQQ-Audit-System\`）
5. 选择开始菜单文件夹
6. 选择是否创建桌面快捷方式
7. 点击"安装"开始安装
8. 安装完成后可选择立即启动应用程序

### 3. 首次运行配置
1. **数据库初始化**: 首次运行时自动创建 SQLite 数据库文件
2. **模板验证**: 自动检查模板文件完整性
3. **用户设置**: 可配置工作目录和数据保存位置

### 4. 数据存储位置
- **应用程序数据**: `%APPDATA%\KQQ-Audit-System\`
- **数据库文件**: `%APPDATA%\KQQ-Audit-System\audit.db`
- **配置文件**: `%APPDATA%\KQQ-Audit-System\config.json`
- **用户模板**: `%USERPROFILE%\Documents\KQQ-Audit-System\Templates\`

### 5. 系统集成
- **文件关联**: 自动关联 `.audit` 项目文件
- **右键菜单**: 可添加"新建审计项目"到右键菜单
- **注册表**: 在 `HKEY_CURRENT_USER\Software\KQQ-Audit-System` 中注册设置

## 常见问题和解决方案

### 1. 安装失败：缺少 VC++ 运行库
**问题**: 安装时提示缺少 `VCRUNTIME140.dll` 或其他 VC++ 库
**解决方案**:
- 安装 Microsoft Visual C++ Redistributable 2015-2022
- 下载地址：https://aka.ms/vs/17/release/vc_redist.x64.exe

### 2. 运行错误：SQLite 模块加载失败
**问题**: 启动时提示 `Cannot find module 'sqlite3'` 或类似错误
**解决方案**:
- 确保安装时以管理员权限运行
- 重新运行 `npm run electron:build` 重建原生模块
- 检查 `asarUnpack` 配置是否正确包含 `**/sqlite3/**`

### 3. 模板文件丢失
**问题**: Word 文档生成功能无法找到模板文件
**解决方案**:
- 检查 `resources/templates/` 目录是否存在且包含模板文件
- 确保打包时 `extraResources` 配置正确
- 重新打包并检查 `resources` 目录是否包含在安装包中

### 4. 杀毒软件误报
**问题**: 杀毒软件将应用程序标记为恶意软件
**解决方案**:
- 将应用程序添加到杀毒软件信任列表
- 使用正规渠道下载安装程序
- 联系杀毒软件厂商提交误报

### 5. 内存不足
**问题**: 处理大型审计项目时内存不足
**解决方案**:
- 关闭不必要的应用程序
- 增加系统虚拟内存
- 将项目数据分割为多个小项目

## 升级和卸载

### 1. 应用程序升级
- 下载新版本安装程序
- 直接安装，会自动覆盖旧版本
- 用户数据会被保留

### 2. 完全卸载
- 通过控制面板的"程序和功能"
- 选择"KQQ-Audit-System"并点击卸载
- 或运行安装目录下的 `Uninstall KQQ-Audit-System.exe`

### 3. 用户数据备份
卸载前备份以下目录：
- `%APPDATA%\KQQ-Audit-System\` (配置文件和数据)
- `%USERPROFILE%\Documents\KQQ-Audit-System\` (用户模板和导出文件)

## 开发人员注意事项

### 1. 调试构建
```bash
# 开发模式运行
npm start

# 构建但不打包
npm run build
```

### 2. 自定义打包配置
修改 `package.json` 中的 `build` 字段：
```json
{
  "build": {
    "win": {
      "target": "nsis",
      "sign": true,  // 代码签名（需要证书）
      "publisherName": "Your Company Name"
    }
  }
}
```

### 3. 代码签名（可选）
对于正式发布，建议进行代码签名：
```bash
# 设置签名证书
set CSC_LINK=path\to\certificate.pfx
set CSC_KEY_PASSWORD=your_password

# 打包并签名
npm run electron:build
```

## 技术支持

- **文档**: 查看项目根目录的 README.md 和 CLAUDE.md
- **问题反馈**: 记录到项目 issue 跟踪系统
- **技术支持**: 联系开发团队

## 版本历史

- v0.1.0 (2024-04) 初始版本发布
  - 基本审计工作流管理
  - Word 文档模板生成
  - SQLite 数据持久化

---
*最后更新: 2026-04-16*