const fs = require('fs-extra');
const path = require('path');

async function createGithubWorkflowsDir() {
  const workflowsPath = path.join(process.cwd(), '.github', 'workflows');
  await fs.ensureDir(workflowsPath);
  return workflowsPath;
}

async function copyWorkflowFiles() {
  const sourceDir = path.join(__dirname, '..', '..', 'workflows');
  const targetDir = path.join(process.cwd(), '.github', 'workflows');
  
  // Ensure target directory exists
  await fs.ensureDir(targetDir);
  
  // Copy all workflow files
  const workflowFiles = [
    'orchestrator.yml',
    'stage-specify.yml',
    'stage-plan.yml',
    'stage-tasks.yml',
    'stage-develop.yml'
  ];
  
  for (const file of workflowFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath);
    } else {
      throw new Error(`Workflow file not found: ${file}`);
    }
  }
  
  return workflowFiles.length;
}

async function createTemplateFile(templateName, targetPath, variables = {}) {
  const templatePath = path.join(__dirname, '..', '..', 'templates', `${templateName}.template`);
  
  if (!await fs.pathExists(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }
  
  let content = await fs.readFile(templatePath, 'utf8');
  
  // Replace template variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  }
  
  await fs.writeFile(targetPath, content);
}

async function copyScriptFiles() {
  const sourceDir = path.join(__dirname, '..', '..', 'scripts');
  const targetDir = path.join(process.cwd(), 'scripts');
  
  await fs.ensureDir(targetDir);
  await fs.copy(sourceDir, targetDir);
}

function getRepositoryInfo() {
  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  
  let repoName = path.basename(cwd);
  let repoOwner = 'your-org';
  
  // Try to get info from package.json
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = require(packageJsonPath);
      if (pkg.repository && typeof pkg.repository === 'string') {
        const match = pkg.repository.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);
        if (match) {
          repoOwner = match[1];
          repoName = match[2].replace(/\.git$/, '');
        }
      } else if (pkg.repository && pkg.repository.url) {
        const match = pkg.repository.url.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);
        if (match) {
          repoOwner = match[1];
          repoName = match[2].replace(/\.git$/, '');
        }
      }
    } catch (error) {
      // Continue with defaults
    }
  }
  
  return { owner: repoOwner, name: repoName };
}

module.exports = {
  createGithubWorkflowsDir,
  copyWorkflowFiles,
  createTemplateFile,
  copyScriptFiles,
  getRepositoryInfo
};