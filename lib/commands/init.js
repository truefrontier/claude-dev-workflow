const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const { validateGitHubCLI, validateRepository, validatePermissions } = require('../utils/validators');
const { copyWorkflowFiles, createGithubWorkflowsDir } = require('../utils/files');
const { setupLabels } = require('./labels');
const { getProjectDetails, generateCommands } = require('../utils/project-detector');

async function initCommand(options) {
  console.log(chalk.blue.bold('\n🚀 GitHub Claude Workflow Setup\n'));
  
  try {
    // Pre-flight checks and project detection
    const { projectDetails, repoInfo } = await runPreflightChecks();
    
    // Interactive setup unless --yes flag
    const config = options.yes ? getDefaultConfig() : await interactiveSetup();
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 Dry Run - Changes that would be made:'));
      await showDryRunPlan(config);
      return;
    }
    
    // Execute setup steps
    await executeSetup(config);
    
    // Show project-specific success message
    await showSuccessMessage(projectDetails);
    
    
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
    spinner.text = 'GitHub CLI ✓ Detecting project...';
    
    // Detect project details
    const projectDetails = await getProjectDetails();
    spinner.text = `Project: ${projectDetails.name} (${projectDetails.framework || projectDetails.language}) ✓ Checking repository...`;
    
    // Check repository
    const repoInfo = await validateRepository();
    spinner.text = `Repository ${repoInfo.name} ✓ Checking permissions...`;
    
    // Check permissions
    await validatePermissions();
    spinner.succeed(`Pre-flight checks passed ✓ (${projectDetails.language} project detected)`);
    
    return { projectDetails, repoInfo };
    
  } catch (error) {
    spinner.fail('Pre-flight checks failed');
    throw error;
  }
}

function getDefaultConfig() {
  return {
    installClaudeApp: true,
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
      name: 'installClaudeApp',
      message: 'Install Claude GitHub App? (Required for Claude Code Action)',
      default: true
    },
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
  if (config.installClaudeApp) {
    console.log('🤖 Install Claude GitHub App: https://github.com/apps/claude');
  }
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
  
  if (config.installClaudeApp) {
    const spinner = ora(`Step ${step}/${totalSteps}: Checking Claude GitHub App installation...`).start();
    try {
      // Check if the app is already installed
      try {
        const repoInfo = execSync('gh api repos/{owner}/{repo}', { stdio: 'pipe' }).toString();
        const repo = JSON.parse(repoInfo);
        const appCheck = execSync(`gh api repos/${repo.full_name}/installation`, { stdio: 'pipe' }).toString();
        
        if (appCheck && appCheck.includes('claude')) {
          spinner.succeed('Claude GitHub App already installed ✓');
        } else {
          throw new Error('App not installed');
        }
      } catch {
        // App not installed, provide instructions
        spinner.warn('Claude GitHub App not installed');
        console.log(chalk.yellow('\n⚠️  Claude GitHub App Required'));
        console.log('The Claude Code Action requires the Claude GitHub App to be installed.');
        console.log('\nTo install:');
        console.log(chalk.cyan('1. Visit: https://github.com/apps/claude'));
        console.log(chalk.cyan('2. Click "Install" or "Configure"'));
        console.log(chalk.cyan('3. Select your repository or organization'));
        console.log(chalk.cyan('4. Grant the required permissions'));
        
        const { continueSetup } = await inquirer.prompt([{
          type: 'confirm',
          name: 'continueSetup',
          message: 'Have you installed the Claude GitHub App?',
          default: false
        }]);
        
        if (!continueSetup) {
          console.log(chalk.red('\n❌ Setup cannot continue without Claude GitHub App'));
          console.log('Please install the app and run setup again.');
          process.exit(1);
        }
        console.log(chalk.green('✓ Continuing with setup...'));
      }
      step++;
    } catch (error) {
      spinner.fail('Failed to verify Claude GitHub App');
      throw error;
    }
  }
  
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

async function showSuccessMessage(projectDetails) {
  const commands = generateCommands(projectDetails);
  
  console.log(chalk.green.bold('\n✅ Claude Dev Workflow initialized successfully!'));
  
  // Project-specific information
  console.log(chalk.blue('\n📋 Project Details:'));
  console.log(`   Language: ${projectDetails.language}`);
  console.log(`   Framework: ${projectDetails.framework || 'Not detected'}`);
  console.log(`   Version: ${projectDetails.version}`);
  
  if (projectDetails.multiType) {
    console.log(`   Multi-language: ${projectDetails.multiType.join(', ')}`);
  }
  
  // Show relevant commands for detected project type
  console.log(chalk.blue('\n🛠️  Detected Commands:'));
  console.log(`   Test: ${chalk.cyan(commands.development.test)}`);
  console.log(`   Build: ${chalk.cyan(commands.development.build)}`);
  console.log(`   Dev: ${chalk.cyan(commands.development.start)}`);
  console.log(`   Lint: ${chalk.cyan(commands.development.lint)}`);
  
  console.log(chalk.blue('\n🚀 Next Steps:'));
  console.log('1. Create an issue describing a feature or bug');
  console.log('2. Comment: @claude-dev-truefrontier');
  console.log('3. The AI will automatically:');
  console.log('   • Analyze your codebase and requirements');
  console.log('   • Generate appropriate specifications');
  console.log('   • Implement code with full testing');
  console.log('   • Use the detected commands above for testing/building');
  
  console.log(chalk.yellow('\n💡 The AI workflows will automatically detect and use your project structure:'));
  if (projectDetails.configFiles) {
    console.log(`   Config files: ${projectDetails.configFiles.join(', ')}`);
  }
  console.log(`   Testing: Will run ${chalk.cyan(commands.development.test)} to validate changes`);
  console.log(`   Building: Will run ${chalk.cyan(commands.development.build)} to ensure compilation`);
  
  if (projectDetails.type === 'node') {
    console.log(chalk.blue('\n📦 Node.js Specific:'));
    console.log('   • AI will read package.json for dependencies and scripts');
    console.log('   • Will use npm/yarn based on lock files detected');
    console.log('   • Framework-specific patterns will be recognized');
  } else if (projectDetails.type === 'php') {
    console.log(chalk.blue('\n🐘 PHP Specific:'));
    console.log('   • AI will read composer.json for dependencies');
    console.log('   • Laravel/Symfony patterns will be recognized');
    console.log('   • PSR standards will be followed');
  } else if (projectDetails.type === 'python') {
    console.log(chalk.blue('\n🐍 Python Specific:'));
    console.log('   • AI will read requirements.txt/pyproject.toml');
    console.log('   • Django/Flask patterns will be recognized');
    console.log('   • PEP 8 standards will be followed');
  }
}

module.exports = { initCommand };