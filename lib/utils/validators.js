const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function validateGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
  } catch (error) {
    const err = new Error('GitHub CLI (gh) is not installed or not in PATH');
    err.code = 'GITHUB_CLI_MISSING';
    throw err;
  }
  
  try {
    execSync('gh auth status', { stdio: 'pipe' });
  } catch (error) {
    const err = new Error('GitHub CLI is not authenticated. Run: gh auth login');
    err.code = 'GITHUB_AUTH_MISSING';
    throw err;
  }
}

async function validateRepository() {
  try {
    const output = execSync('gh repo view --json nameWithOwner,permissions', { 
      encoding: 'utf8',
      stdio: 'pipe' 
    });
    
    const repoInfo = JSON.parse(output);
    
    if (!repoInfo.nameWithOwner) {
      const err = new Error('Not in a GitHub repository or repository not found');
      err.code = 'NOT_A_REPO';
      throw err;
    }
    
    return {
      name: repoInfo.nameWithOwner,
      permissions: repoInfo.permissions
    };
    
  } catch (error) {
    if (error.code) throw error;
    
    const err = new Error('Failed to access repository information');
    err.code = 'REPO_ACCESS_FAILED';
    throw err;
  }
}

async function validatePermissions() {
  try {
    const output = execSync('gh repo view --json permissions', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const repoInfo = JSON.parse(output);
    const permissions = repoInfo.permissions;
    
    if (!permissions.admin && !permissions.maintain) {
      const err = new Error('Repository admin access required for setup');
      err.code = 'NO_REPO_ACCESS';
      throw err;
    }
    
    return permissions;
    
  } catch (error) {
    if (error.code) throw error;
    
    const err = new Error('Unable to verify repository permissions');
    err.code = 'PERMISSION_CHECK_FAILED';
    throw err;
  }
}

async function validateWorkflowFiles() {
  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
  const requiredFiles = [
    'orchestrator.yml',
    'stage-triage.yml',
    'stage-spec.yml',
    'stage-architect.yml', 
    'stage-develop.yml'
  ];
  
  const missing = [];
  const invalid = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(workflowsDir, file);
    
    if (!await fs.pathExists(filePath)) {
      missing.push(file);
      continue;
    }
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Basic YAML validation
      if (!content.includes('name:') || !content.includes('on:') || !content.includes('jobs:')) {
        invalid.push(file);
      }
      
      // Check for required secrets
      if (!content.includes('ANTHROPIC_API_KEY') && file !== 'orchestrator.yml') {
        invalid.push(`${file} (missing ANTHROPIC_API_KEY)`);
      }
      
    } catch (error) {
      invalid.push(`${file} (read error)`);
    }
  }
  
  return { missing, invalid, valid: requiredFiles.length - missing.length - invalid.length };
}

async function validateLabels() {
  try {
    const output = execSync('gh label list --json name', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const labels = JSON.parse(output);
    const labelNames = labels.map(l => l.name);
    
    const requiredLabels = [
      'needs:triage', 'needs:triage-revision',
      'needs:spec', 'needs:spec-revision', 
      'needs:architect', 'needs:architect-revision',
      'needs:develop', 'needs:develop-revision',
      'review:triage', 'review:spec', 'review:architect', 'review:develop',
      'error:triage', 'error:spec', 'error:architect', 'error:develop'
    ];
    
    const missing = requiredLabels.filter(label => !labelNames.includes(label));
    const existing = requiredLabels.filter(label => labelNames.includes(label));
    
    return { missing, existing, total: requiredLabels.length };
    
  } catch (error) {
    throw new Error('Failed to check repository labels');
  }
}

async function validateSecrets() {
  try {
    const output = execSync('gh secret list --json name', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const secrets = JSON.parse(output);
    const secretNames = secrets.map(s => s.name);
    
    return {
      hasAnthropicKey: secretNames.includes('ANTHROPIC_API_KEY'),
      secrets: secretNames
    };
    
  } catch (error) {
    throw new Error('Failed to check repository secrets');
  }
}

module.exports = {
  validateGitHubCLI,
  validateRepository,
  validatePermissions,
  validateWorkflowFiles,
  validateLabels,
  validateSecrets
};