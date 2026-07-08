#!/usr/bin/env node
/**
 * 软著源代码文档生成脚本
 * 生成前60页 + 后60页，每页50行
 */

import fs from 'fs';
import path from 'path';

const LINES_PER_PAGE = 50;
const PAGES = 60;
const TOTAL_LINES = LINES_PER_PAGE * PAGES;

// 要包含的文件类型
const FILE_EXTENSIONS = ['.tsx', '.ts'];

// 要排除的目录
const EXCLUDE_DIRS = ['node_modules', '.expo', 'dist', 'build'];

// 软件信息
const SOFTWARE_NAME = '流痕江湖社交App';
const VERSION = 'V1.0';

function shouldExclude(filePath) {
  return EXCLUDE_DIRS.some(dir => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`));
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!shouldExclude(fullPath)) {
        getAllFiles(fullPath, files);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (FILE_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function formatCode(content, filePath) {
  const lines = content.split('\n');
  const formattedLines = [];
  
  // 添加文件头注释
  formattedLines.push(`// ============================================================`);
  formattedLines.push(`// 文件: ${path.basename(filePath)}`);
  formattedLines.push(`// 路径: ${filePath}`);
  formattedLines.push(`// ============================================================`);
  
  // 添加代码内容
  for (const line of lines) {
    // 截断过长的行
    const truncatedLine = line.length > 80 ? line.substring(0, 77) + '...' : line;
    formattedLines.push(truncatedLine);
  }
  
  // 添加空行分隔
  formattedLines.push('');
  formattedLines.push('');
  
  return formattedLines;
}

function generateSourceDoc(clientDir, serverDir, outputPath) {
  console.log('开始生成软著源代码文档...\n');
  
  let allLines = [];
  
  // 收集前端代码
  console.log('收集前端代码...');
  const clientFiles = getAllFiles(clientDir);
  for (const file of clientFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(clientDir, file);
    const formatted = formatCode(content, `client/${relativePath}`);
    allLines.push(...formatted);
  }
  console.log(`前端文件: ${clientFiles.length} 个`);
  
  // 收集后端代码
  console.log('收集后端代码...');
  const serverFiles = getAllFiles(serverDir);
  for (const file of serverFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(serverDir, file);
    const formatted = formatCode(content, `server/${relativePath}`);
    allLines.push(...formatted);
  }
  console.log(`后端文件: ${serverFiles.length} 个`);
  
  console.log(`\n总代码行数: ${allLines.length}`);
  
  // 生成前60页
  const frontLines = allLines.slice(0, TOTAL_LINES);
  
  // 生成后60页
  const backLines = allLines.length > TOTAL_LINES * 2
    ? allLines.slice(-TOTAL_LINES)
    : allLines.slice(TOTAL_LINES);
  
  // 写入文件
  const output = [];
  
  // 封面
  output.push('='.repeat(60));
  output.push('');
  output.push(`            ${SOFTWARE_NAME} 源代码文档`);
  output.push(`                    ${VERSION}`);
  output.push('');
  output.push('='.repeat(60));
  output.push('');
  output.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
  output.push(`总文件数: ${clientFiles.length + serverFiles.length}`);
  output.push(`总代码行数: ${allLines.length}`);
  output.push('');
  output.push('='.repeat(60));
  output.push('');
  output.push('');
  
  // 前60页
  output.push('-'.repeat(60));
  output.push('                        前 60 页');
  output.push('-'.repeat(60));
  output.push('');
  
  for (let i = 0; i < frontLines.length; i++) {
    output.push(frontLines[i]);
    
    // 每50行添加分页标记
    if ((i + 1) % LINES_PER_PAGE === 0) {
      const pageNum = Math.floor((i + 1) / LINES_PER_PAGE);
      output.push('');
      output.push(`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
      output.push(`                           第 ${pageNum} 页`);
      output.push(`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
      output.push('');
    }
  }
  
  output.push('');
  output.push('');
  
  // 后60页
  output.push('-'.repeat(60));
  output.push('                        后 60 页');
  output.push('-'.repeat(60));
  output.push('');
  
  for (let i = 0; i < backLines.length; i++) {
    output.push(backLines[i]);
    
    // 每50行添加分页标记
    if ((i + 1) % LINES_PER_PAGE === 0) {
      const pageNum = Math.floor((i + 1) / LINES_PER_PAGE);
      output.push('');
      output.push(`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
      output.push(`                           第 ${pageNum} 页`);
      output.push(`- - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
      output.push('');
    }
  }
  
  // 写入文件
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');
  console.log(`\n✅ 源代码文档已生成: ${outputPath}`);
  console.log(`   文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

// 执行
const clientDir = '/workspace/projects/client';
const serverDir = '/workspace/projects/server';
const outputPath = '/workspace/projects/assets/software-copyright/源代码文档.txt';

generateSourceDoc(clientDir, serverDir, outputPath);
