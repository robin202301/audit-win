import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

function getTemplatePath(templateName: string): string {
  let basePath: string;
  if (process.env.NODE_ENV === 'development') {
    basePath = path.resolve(__dirname, '../../../../resources/templates');
  } else {
    basePath = path.join(process.resourcesPath, 'resources', 'templates');
  }

  // 尝试匹配模板文件名（支持中文命名和多种扩展名）
  const possibleNames = [
    `${templateName}.docx`,
    `${templateName}.doc`,
    `${templateName}.xlsx`,
    `${templateName}.xls`,
    templateName,
  ];

  for (const name of possibleNames) {
    const filePath = path.join(basePath, name);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(`模板文件不存在：${templateName}，查找路径：${basePath}`);
}

export async function generateDocument(
  templateName: string,
  data: Record<string, unknown>,
  outputPath: string
): Promise<void> {
  const templatePath = getTemplatePath(templateName);
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(data);

  const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, outputBuffer as Buffer);
}

export function getTemplatePathByName(templateName: string): string {
  let basePath: string;
  if (process.env.NODE_ENV === 'development') {
    basePath = path.resolve(__dirname, '../../../../resources/templates');
  } else {
    basePath = path.join(process.resourcesPath, 'resources', 'templates');
  }

  // 尝试匹配模板文件名（支持中文命名和多种扩展名）
  const possibleNames = [
    `${templateName}.xlsx`,
    `${templateName}.xls`,
    templateName,
  ];

  for (const name of possibleNames) {
    const filePath = path.join(basePath, name);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(`模板文件不存在：${templateName}，查找路径：${basePath}`);
}

export async function generateExcel(
  templateName: string,
  data: Record<string, unknown>,
  outputPath: string
): Promise<void> {
  const templatePath = getTemplatePathByName(templateName);
  const XLSX = await import('xlsx');
  const wb = XLSX.readFile(templatePath);
  const ws = wb.Sheets[wb.SheetNames[0]];

  if (!ws) throw new Error('Excel 模板中无可用工作表');

  // 替换单元格中的 {placeholder}
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (cell && typeof cell.v === 'string') {
        let text = cell.v;
        // 替换 {key} 占位符
        text = text.replace(/\{(\w+)\}/g, (_match: string, key: string) => {
          const val = data[key];
          return val !== undefined ? String(val) : '';
        });
        cell.v = text;
        if (cell.w) cell.w = text;
      }
    }
  }

  XLSX.writeFile(wb, outputPath);
}

export function getAvailableTemplates(): string[] {
  let basePath: string;
  if (process.env.NODE_ENV === 'development') {
    basePath = path.resolve(__dirname, '../../../../resources/templates');
  } else {
    basePath = path.join(process.resourcesPath, 'resources', 'templates');
  }

  if (!fs.existsSync(basePath)) return [];

  return fs.readdirSync(basePath).filter((name: string) => {
    return name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.xlsx') || name.endsWith('.xls');
  });
}

export async function readTemplateText(templateName: string): Promise<string> {
  const templatePath = getTemplatePath(templateName);
  const ext = path.extname(templatePath).toLowerCase();

  if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = await import('xlsx');
    const wb = XLSX.readFile(templatePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return '';
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const lines: string[] = [];
    for (let R = range.s.r; R <= range.e.r; R++) {
      const rowCells: string[] = [];
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (cell && cell.v !== undefined) {
          rowCells.push(String(cell.v));
        }
      }
      if (rowCells.length > 0) lines.push(rowCells.join('\t'));
    }
    return lines.join('\n');
  }

  // docx/doc: 读取 word/document.xml 提取文本，保留 {placeholder}
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('无效的 Word 文档结构');
  const rawContent = (docFile as unknown as { _data: { getContent: () => string | ArrayBuffer } })._data.getContent();
  const xml = typeof rawContent === 'string' ? rawContent : Buffer.from(rawContent).toString('utf8');

  // 按段落组织：跳过 <w:pPr> 样式标签，只提取 <w:r> 中的文本
  const paragraphs: string[] = [];
  const pRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  const pMatches = xml.match(pRegex) || [];
  for (const p of pMatches) {
    // 移除段落属性标签
    const contentOnly = p.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, '');
    const tMatches = contentOnly.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
    const texts = tMatches.map((t: string) => t.replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/, '$1'));
    if (texts.length > 0) {
      paragraphs.push(texts.join(''));
    }
  }

  return paragraphs.join('\n');
}

export function getTemplatePlaceholders(templateName: string): string[] {
  try {
    const templatePath = getTemplatePath(templateName);
    const ext = path.extname(templatePath).toLowerCase();

    if (ext === '.xlsx' || ext === '.xls') {
      // 对于Excel模板，暂不校验占位符
      return [];
    }

    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);
    const docFile = zip.file('word/document.xml');
    if (!docFile) return [];
    const rawContent = (docFile as unknown as { _data: { getContent: () => string | ArrayBuffer } })._data.getContent();
    const xml = typeof rawContent === 'string' ? rawContent : Buffer.from(rawContent).toString('utf8');

    // 先去除所有 XML 标签获取纯文本（Word 经常把 {xxx} 占位符拆分成多个 run）
    const plainText = xml.replace(/<[^>]+>/g, '');

    // 从纯文本中提取所有 {xxx} 占位符
    const placeholders = new Set<string>();
    const placeholderRegex = /\{([^{}]+)\}/g;
    let match;
    while ((match = placeholderRegex.exec(plainText)) !== null) {
      const name = match[1].trim();
      // 过滤掉 docxtemplater 的特殊语法（如 #if, /if, #for, /for 等）
      if (name && !name.startsWith('#') && !name.startsWith('/') && !name.startsWith('^')) {
        placeholders.add(name);
      }
    }
    return Array.from(placeholders);
  } catch {
    return [];
  }
}

export function validateTemplatePlaceholders(
  templateName: string,
  data: Record<string, unknown>
): { missing: string[]; all: string[] } {
  const all = getTemplatePlaceholders(templateName);
  const missing = all.filter(key => {
    const val = data[key];
    return val === undefined || val === null || val === '';
  });
  return { all, missing };
}
