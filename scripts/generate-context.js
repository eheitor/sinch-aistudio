import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajuste para pegar a raiz do projeto (uma pasta acima da pasta 'scripts')
const rootDir = path.join(__dirname, '..');
const outputFile = path.join(rootDir, 'project_context.txt');

// Pastas e arquivos para ignorar
const IGNORE_LIST = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.DS_Store',
  'package-lock.json',
  'project_context.txt', // Não incluir a si mesmo
  'scripts', // Opcional: não precisa incluir este script no contexto
  '.env',
  'README.md' // Opcional, já que é documentação
];

// Extensões permitidas (para evitar ler binários/imagens como texto)
const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.txt'
];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    
    // Verifica se deve ignorar
    if (IGNORE_LIST.includes(file)) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Verifica extensão
      const ext = path.extname(file);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

console.log('Gerando contexto do projeto...');

try {
  const allFiles = getAllFiles(rootDir);
  let outputContent = `Este é o contexto atual do projeto. Por favor, analise os arquivos abaixo para continuarmos o desenvolvimento.\n\n`;

  allFiles.forEach(filePath => {
    const relativePath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    outputContent += `--- START OF FILE ${relativePath} ---\n`;
    outputContent += content;
    outputContent += `\n\n`;
  });

  fs.writeFileSync(outputFile, outputContent);
  console.log(`✅ Sucesso! Arquivo gerado em: ${outputFile}`);
  console.log(`📋 Copie o conteúdo deste arquivo e cole na sua nova sessão do AI Studio.`);

} catch (err) {
  console.error('Erro ao gerar contexto:', err);
}
