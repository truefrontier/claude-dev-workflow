#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const c = (color, text) => process.stdout.isTTY ? `${colors[color]}${text}${colors.reset}` : text;

console.log(c('blue', '\n🔍 GitHub Claude Workflow Validation'));
console.log('====================================\n');

const workflowsDir = path.join(process.cwd(), 'workflows');
const requiredWorkflows = [
  'orchestrator.yml',
  'stage-specify.yml',
  'stage-plan.yml',
  'stage-tasks.yml',
  'stage-develop.yml'
];

let allValid = true;

// Check if workflows directory exists
if (!fs.existsSync(workflowsDir)) {
  console.log(c('red', '❌ Workflows directory not found: workflows/'));
  console.log(c('yellow', '   Copy workflow files to workflows/ directory'));
  process.exit(1);
}

// Validate each required workflow
requiredWorkflows.forEach(filename => {
  const filepath = path.join(workflowsDir, filename);
  
  console.log(`Checking ${filename}...`);
  
  if (!fs.existsSync(filepath)) {
    console.log(c('red', `  ❌ Missing: ${filename}`));
    allValid = false;
    return;
  }
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const workflow = yaml.load(content);
    
    // Basic validation
    if (!workflow.name) {
      console.log(c('yellow', '  ⚠️  Missing workflow name'));
    }
    
    if (!workflow.on) {
      console.log(c('red', '  ❌ Missing trigger conditions (on:)'));
      allValid = false;
    }
    
    if (!workflow.jobs) {
      console.log(c('red', '  ❌ Missing jobs definition'));
      allValid = false;
    }
    
    // Check for required secrets reference
    const contentStr = content.toLowerCase();
    if (!contentStr.includes('anthropic_api_key')) {
      console.log(c('yellow', '  ⚠️  No ANTHROPIC_API_KEY reference found'));
    }
    
    // Check for claude-code-action usage
    if (filename !== 'orchestrator.yml' && !contentStr.includes('anthropics/claude-code-action')) {
      console.log(c('yellow', '  ⚠️  No claude-code-action usage found'));
    }

    // Check for GitHub MCP tool usage in non-develop stages
    if (['stage-specify.yml', 'stage-plan.yml', 'stage-tasks.yml'].includes(filename)) {
      if (!contentStr.includes('mcp__github__get_issue_comments')) {
        console.log(c('yellow', '  ⚠️  No GitHub MCP comment retrieval found'));
      }
    }
    
    console.log(c('green', '  ✅ Valid YAML structure'));
    
  } catch (error) {
    console.log(c('red', `  ❌ Invalid YAML: ${error.message}`));
    allValid = false;
  }
});

console.log();

// Check for GitHub workflows directory
const githubWorkflowsDir = path.join(process.cwd(), '.github', 'workflows');
if (!fs.existsSync(githubWorkflowsDir)) {
  console.log(c('yellow', '⚠️  .github/workflows/ directory not found'));
  console.log(c('blue', '   You need to copy workflow files to .github/workflows/ for GitHub Actions'));
} else {
  const installedWorkflows = requiredWorkflows.filter(filename => 
    fs.existsSync(path.join(githubWorkflowsDir, filename))
  );
  
  if (installedWorkflows.length === requiredWorkflows.length) {
    console.log(c('green', '✅ All workflows installed in .github/workflows/'));
  } else {
    console.log(c('yellow', `⚠️  ${installedWorkflows.length}/${requiredWorkflows.length} workflows installed in .github/workflows/`));
    console.log(c('blue', '   Copy missing workflows from workflows/ to .github/workflows/'));
  }
}

if (allValid) {
  console.log(c('green', '\n🎉 All workflow files are valid!'));
  console.log(c('blue', '\nGitHub Claude Workflow v2 - Spec-Kit Based System'));
  console.log('✅ 4-stage workflow: specify → plan → tasks → develop');
  console.log('✅ GitHub MCP tool integration');
  console.log('✅ All stages required with human approval');
  console.log(c('blue', '\nNext steps:'));
  console.log('1. Copy workflows to .github/workflows/');
  console.log('2. Configure ANTHROPIC_API_KEY secret');
  console.log('3. Run: npm run setup:labels (will create v2 labels)');
} else {
  console.log(c('red', '\n❌ Some workflow files have issues. Please fix them before proceeding.'));
  process.exit(1);
}