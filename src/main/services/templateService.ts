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

  // 尝试匹配模板文件名
  const possibleNames = [
    templateName,
    `${templateName}.docx`,
    `tpl_${templateName}.docx`,
    `tpl_${templateName}.doc`,
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

  // 尝试匹配模板文件名
  const possibleNames = [
    templateName,
    `${templateName}.xlsx`,
    `tpl_${templateName}.xlsx`,
    `${templateName}.xls`,
    `tpl_${templateName}.xls`,
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
