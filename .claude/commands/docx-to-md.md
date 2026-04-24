# /docx-to-md

将 Word 文档 (.docx) 转换为 Markdown 格式。

## 使用方法

```
/docx-to-md path/to/document.docx
```

或直接指定文件名：

```
/docx-to-md 审计流程
```

## 执行步骤

1. 如果参数没有 `.docx` 后缀，自动追加 `.docx`
2. 如果路径不是绝对路径，在当前工作目录下查找
3. 使用 `npx mammoth --output-format=markdown <file>` 转换
4. 将输出结果以 Markdown 代码块形式展示
5. 如果 mammoth 未安装，先运行 `npm install -g mammoth` 或使用项目本地的 mammoth

## 注意事项

- mammoth 只能提取文本内容，无法保留复杂排版（表格、图片等）
- 如果需要保留表格结构，转换后手动整理
- 转换结果可以直接输出或写入同名 `.md` 文件
