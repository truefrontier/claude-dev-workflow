const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const { validateGitHubCLI, validateRepository, validatePermissions } = require('../utils/validators');
const { copyWorkflowFiles, createGithubWorkflowsDir } = require('../utils/files');
const { setupLabels } = require('./labels');

async function initCommand(options) {
  console.log(chalk.blue.bold('\n🚀 GitHub Claude Workflow Setup\n'));
  
  try {
    // Pre-flight checks
    await runPreflightChecks();
    
    // Interactive setup unless --yes flag
    const config = options.yes ? getDefaultConfig() : await interactiveSetup();
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 Dry Run - Changes that would be made:'));
      await showDryRunPlan(config);
      return;
    }
    
    // Execute setup steps
    await executeSetup(config);
    
    console.log(chalk.green.bold('\n✅ GitHub Claude Workflow initialized successfully!'));
    console.log(chalk.blue('\nNext steps:'));
    console.log('1. Create an issue in your repository');
    console.log('2. Comment: @claude-dev-truefrontier');
    console.log('3. Follow the AI-guided workflow!');
    
  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error.message);
    
    if (error.code === 'GITHUB_CLI_MISSING') {
      console.log(chalk.yellow('Install GitHub CLI: https://cli.github.com/'));
    } else if (error.code === 'NO_REPO_ACCESS') {
      console.log(chalk.yellow('Ensure you have repository admin access'));
    } else if (error.code === 'API_KEY_MISSING') {
      console.log(chalk.yellow('Set up API key: gh secret set ANTHROPIC_API_KEY'));
    }
    
    process.exit(1);
  }
}

async function runPreflightChecks() {
  const spinner = ora('Running pre-flight checks...').start();
  
  try {
    // Check GitHub CLI
    await validateGitHubCLI();
    spinner.text = 'GitHub CLI ✓ Checking repository...';
    
    // Check repository
    const repoInfo = await validateRepository();
    spinner.text = `Repository ${repoInfo.name} ✓ Checking permissions...`;
    
    // Check permissions
    await validatePermissions();
    spinner.succeed('Pre-flight checks passed ✓');
    
  } catch (error) {
    spinner.fail('Pre-flight checks failed');
    throw error;
  }
}

function getDefaultConfig() {
  return {
    copyWorkflows: true,
    setupLabels: true,
    addCollaborator: true,
    configureSecret: true,
    createSampleIssue: false
  };
}

async function interactiveSetup() {
  console.log(chalk.cyan('Configure your setup:\n'));
  
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'copyWorkflows',
      message: 'Copy workflow files to .github/workflows/?',
      default: true
    },
    {
      type: 'confirm', 
      name: 'setupLabels',
      message: 'Create required GitHub labels?',
      default: true
    },
    {
      type: 'confirm',
      name: 'addCollaborator',
      message: 'Add @claude-dev-truefrontier as collaborator?',
      default: true
    },
    {
      type: 'confirm',
      name: 'configureSecret',
      message: 'Configure ANTHROPIC_API_KEY secret?',
      default: true,
      when: (answers) => {
        // Only ask if we can't detect existing secret
        try {
          execSync('gh secret list | grep ANTHROPIC_API_KEY', { stdio: 'pipe' });
          return false; // Secret exists, skip
        } catch {
          return true; // Secret missing, ask user
        }
      }
    },
    {
      type: 'confirm',
      name: 'createSampleIssue',
      message: 'Create a sample issue to test the workflow?',
      default: false
    }
  ]);
}

async function showDryRunPlan(config) {
  if (config.copyWorkflows) {
    console.log('📁 Copy workflow files: workflows/* → .github/workflows/');
  }
  if (config.setupLabels) {
    console.log('🏷️  Create workflow labels: needs:*, review:*, error:*');
  }
  if (config.addCollaborator) {
    console.log('👤 Add collaborator: claude-dev-truefrontier');
  }
  if (config.configureSecret) {
    console.log('🔑 Configure secret: ANTHROPIC_API_KEY');
  }
  if (config.createSampleIssue) {
    console.log('📋 Create sample issue with workflow trigger');
  }
}

async function executeSetup(config) {
  let step = 1;
  const totalSteps = Object.values(config).filter(Boolean).length;
  
  if (config.copyWorkflows) {
    const spinner = ora(`Step ${step}/${totalSteps}: Copying workflow files...`).start();
    try {
      await createGithubWorkflowsDir();
      await copyWorkflowFiles();
      spinner.succeed('Workflow files copied ✓');
      step++;
    } catch (error) {
      spinner.fail('Failed to copy workflow files');
      throw error;
    }
  }
  
  if (config.setupLabels) {
    const spinner = ora(`Step ${step}/${totalSteps}: Setting up GitHub labels...`).start();
    try {
      await setupLabels();
      spinner.succeed('GitHub labels created ✓');
      step++;
    } catch (error) {
      spinner.fail('Failed to create labels');
      throw error;
    }
  }
  
  if (config.addCollaborator) {
    const spinner = ora(`Step ${step}/${totalSteps}: Adding collaborator...`).start();
    try {
      execSync('gh repo add-collaborator claude-dev-truefrontier', { stdio: 'pipe' });
      spinner.succeed('Collaborator added ✓');
      step++;
    } catch (error) {
      spinner.warn('Collaborator may already exist or invitation sent ⚠️');
      step++;
    }
  }
  
  if (config.configureSecret) {
    console.log(chalk.yellow(`\nStep ${step}/${totalSteps}: Configure API Key`));
    console.log('Run this command and paste your Anthropic API key:');
    console.log(chalk.cyan('gh secret set ANTHROPIC_API_KEY'));
    console.log('Get your API key at: https://console.anthropic.com/');
    
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter after configuring the secret...'
    }]);
    step++;
  }
  
  if (config.createSampleIssue) {
    const spinner = ora(`Step ${step}/${totalSteps}: Creating sample issue...`).start();
    try {
      const issueBody = `## Sample Feature Request

This is a test issue to demonstrate the GitHub Claude Workflow system.

### Requirements
- Create a simple "Hello World" function
- Add basic tests
- Document the function

**To start the workflow, comment:** \`@claude-dev-truefrontier\``;

      execSync(`gh issue create --title "Sample: Hello World Function" --body "${issueBody}"`, { stdio: 'pipe' });
      spinner.succeed('Sample issue created ✓');
      step++;
    } catch (error) {
      spinner.fail('Failed to create sample issue');
      throw error;
    }
  }
}

module.exports = { initCommand };