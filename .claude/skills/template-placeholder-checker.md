# /check-placeholders

检查 Word/Excel 模板中是否包含指定的占位符，如果缺少则自动添加。

## 使用方法

```
/check-placeholders <模板文件名> <占位符1> <占位符2> ...
```

或指定位置添加：

```
/check-placeholders <模板文件名> --after "<文本>" <占位符>
/check-placeholders <模板文件名> --cell <行号>,<列号> <占位符>
```

## 适用场景

- 审计公文模板需要统一添加 `{projectName}`、`{auditedUnit}` 等通用占位符
- 新增模板后校验占位符是否完整
- 批量检查多个模板

## 执行步骤

### 1. 解析参数

- 第一个参数为模板文件名（在 `resources/templates/` 目录下查找）
- 后续参数为需要检查/添加的占位符名（不带花括号）
- 支持 `--after "<文本>"` 指定插入位置（在包含该文本的位置后插入）
- 支持 `--cell <行>,<列>` 指定 Excel 单元格位置

### 2. 检查占位符存在情况

对于 `.docx` 文件：
```python
import zipfile, re

with zipfile.ZipFile(filepath) as z:
    xml = z.read('word/document.xml').decode('utf-8')
    plain = re.sub(r'<[^>]+>', '', xml)  # 去除 XML 标签
    # 查找所有 {xxx} 占位符
    placeholders = set()
    for m in re.finditer(r'\{([^{}]+)\}', plain):
        name = m.group(1).strip()
        if name and not name.startswith('#') and not name.startswith('/') and not name.startswith('^'):
            placeholders.add(name)
```

对于 `.xlsx` 文件：
```python
import openpyxl

wb = openpyxl.load_workbook(filepath)
ws = wb.active
placeholders = set()
for row in ws.iter_rows():
    for cell in row:
        if cell.value and isinstance(cell.value, str):
            for m in re.finditer(r'\{(\w+)\}', cell.value):
                placeholders.add(m.group(1))
```

### 3. 报告缺失情况

输出检查结果，列出已存在和缺失的占位符。

### 4. 添加缺失的占位符

**Word 文档 (.docx)** — 使用 python-docx 或直接修改 XML：

```python
import zipfile, tempfile, shutil, os

# 解压
tmpdir = tempfile.mkdtemp()
with zipfile.ZipFile(filepath, 'r') as z:
    z.extractall(tmpdir)

xml_path = os.path.join(tmpdir, 'word', 'document.xml')
with open(xml_path) as f:
    xml = f.read()

# 方式 A：在指定文本后插入
if '--after' in args:
    target_text = args['--after']
    placeholder = f'{{{args["placeholder"]}}}'
    if target_text in xml and placeholder not in xml:
        xml = xml.replace(target_text, target_text + placeholder, 1)

# 方式 B：在指定单元格插入
# 找到对应的 w:t 标签，修改内容

with open(xml_path, 'w') as f:
    f.write(xml)

# 重新压缩
with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as z:
    for root_dir, dirs, files in os.walk(tmpdir):
        for fn in files:
            full = os.path.join(root_dir, fn)
            arcname = os.path.relpath(full, tmpdir)
            z.write(full, arcname)

shutil.rmtree(tmpdir)
```

**Excel 文件 (.xlsx)** — 使用 openpyxl：

```python
import openpyxl

wb = openpyxl.load_workbook(filepath)
ws = wb.active
cell = ws.cell(row=row, column=col)
cell.value = (cell.value or '') + '{placeholder}'
wb.save(filepath)
```

### 5. 验证

添加完成后重新检查，确认占位符已成功添加。

## 注意事项

- `.docx` 文件本质是 ZIP 压缩包，需要用 zipfile 解压后修改内部 XML
- Word 经常把占位符拆分成多个 `<w:t>` 元素，检查时需要先去除 XML 标签获取纯文本
- 修改完成后必须重新压缩，保持 ZIP 格式正确
- Excel 可能有共享字符串表 (sharedStrings.xml) 和内联值两种方式，需要都处理
- 操作前建议备份原文件

## 常用占位符参考

| 占位符 | 含义 | 适用模板 |
|--------|------|---------|
| `{projectName}` | 项目名称 | 所有公文类模板 |
| `{auditedUnit}` | 被审计单位 | 所有公文类模板 |
| `{auditedLeaderName}` | 被审计领导干部姓名 | 经济责任审计相关 |
| `{auditStartDate}` | 审计开始日期 | 通知书、公示等 |
| `{content}` | 正文内容 | 通用 |
| `{text}` | 补充文本 | 通用 |
