import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

function getTemplatePath(templateName: string): string {
  // 在开发环境和生产环境中都能找到模板
  let basePath: string;
  if (process.env.NODE_ENV === 'development') {
    basePath = path.resolve(__dirname, '../../../../resources/templates');
  } else {
    basePath = path.join(process.resourcesPath, 'templates');
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

export function getAvailableTemplates(): string[] {
  let basePath: string;
  if (process.env.NODE_ENV === 'development') {
    basePath = path.resolve(__dirname, '../../../../resources/templates');
  } else {
    basePath = path.join(process.resourcesPath, 'templates');
  }

  if (!fs.existsSync(basePath)) return [];

  return fs.readdirSync(basePath).filter((name: string) => {
    return name.endsWith('.docx') || name.endsWith('.doc');
  });
}
