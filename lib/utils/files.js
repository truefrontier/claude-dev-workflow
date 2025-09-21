const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function createGithubWorkflowsDir() {
  const workflowsPath = path.join(process.cwd(), '.github', 'workflows');
  await fs.ensureDir(workflowsPath);
  return workflowsPath;
}

async function copyWorkflowFiles() {
  const sourceDir = path.join(__dirname, '..', '..', 'workflows');
  const targetDir = path.join(process.cwd(), '.github', 'workflows');

  // Detect current branch for base_branch configuration
  let currentBranch = 'main'; // Default fallback
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      stdio: 'pipe',
      encoding: 'utf8'
    }).trim();
  } catch (error) {
    // If git command fails, use 'main' as default
    console.log('Could not detect current branch, defaulting to "main"');
  }

  // Ensure target directory exists
  await fs.ensureDir(targetDir);

  // Remove old v1 workflow files if they exist
  const oldWorkflowFiles = [
    'stage-triage.yml',
    'stage-architect.yml',
    'stage-spec.yml'
  ];

  let removedCount = 0;
  for (const file of oldWorkflowFiles) {
    const oldFilePath = path.join(targetDir, file);
    if (await fs.pathExists(oldFilePath)) {
      await fs.remove(oldFilePath);
      removedCount++;
    }
  }

  // Copy all new v2 workflow files
  const workflowFiles = [
    'orchestrator.yml',
    'stage-specify.yml',
    'stage-plan.yml',
    'stage-develop.yml'
  ];

  for (const file of workflowFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (await fs.pathExists(sourcePath)) {
      // Read source file content
      let content = await fs.readFile(sourcePath, 'utf8');

      // Replace placeholder base_branch with detected current branch
      content = content.replace(/base_branch: "main"/g, `base_branch: "${currentBranch}"`);

      // Write modified content to target
      await fs.writeFile(targetPath, content);
    } else {
      throw new Error(`Workflow file not found: ${file}`);
    }
  }

  return {
    copied: workflowFiles.length,
    removed: removedCount,
    baseBranch: currentBranch
  };
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