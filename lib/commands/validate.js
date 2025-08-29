const chalk = require('chalk');
const ora = require('ora');
const { 
  validateGitHubCLI, 
  validateRepository, 
  validatePermissions,
  validateWorkflowFiles,
  validateLabels,
  validateSecrets
} = require('../utils/validators');

async function validateCommand() {
  console.log(chalk.blue.bold('\n🔍 GitHub Claude Workflow Validation'));
  console.log('====================================\n');

  let allValid = true;
  const results = {};

  // GitHub CLI validation
  const cliSpinner = ora('Checking GitHub CLI...').start();
  try {
    await validateGitHubCLI();
    cliSpinner.succeed('GitHub CLI ✓');
    results.githubCLI = { valid: true };
  } catch (error) {
    cliSpinner.fail(`GitHub CLI ✗ ${error.message}`);
    results.githubCLI = { valid: false, error: error.message };
    allValid = false;
  }

  // Repository validation
  const repoSpinner = ora('Checking repository...').start();
  try {
    const repoInfo = await validateRepository();
    const permissions = await validatePermissions();
    repoSpinner.succeed(`Repository ${repoInfo.name} ✓`);
    results.repository = { valid: true, info: repoInfo, permissions };
  } catch (error) {
    repoSpinner.fail(`Repository ✗ ${error.message}`);
    results.repository = { valid: false, error: error.message };
    allValid = false;
  }

  // Workflow files validation
  const workflowSpinner = ora('Checking workflow files...').start();
  try {
    const workflowStatus = await validateWorkflowFiles();
    if (workflowStatus.missing.length > 0 || workflowStatus.invalid.length > 0) {
      workflowSpinner.fail(`Workflow files ✗ ${workflowStatus.missing.length} missing, ${workflowStatus.invalid.length} invalid`);
      console.log(chalk.red('  Missing:'), workflowStatus.missing.join(', '));
      console.log(chalk.red('  Invalid:'), workflowStatus.invalid.join(', '));
      allValid = false;
    } else {
      workflowSpinner.succeed(`Workflow files ✓ ${workflowStatus.valid}/5 files valid`);
    }
    results.workflows = workflowStatus;
  } catch (error) {
    workflowSpinner.fail(`Workflow files ✗ ${error.message}`);
    results.workflows = { valid: false, error: error.message };
    allValid = false;
  }

  // Labels validation
  const labelsSpinner = ora('Checking workflow labels...').start();
  try {
    const labelStatus = await validateLabels();
    if (labelStatus.missing.length > 0) {
      labelsSpinner.warn(`Labels ⚠️  ${labelStatus.existing.length}/${labelStatus.total} configured`);
      console.log(chalk.yellow('  Missing:'), labelStatus.missing.join(', '));
      console.log(chalk.cyan('  Fix with:'), 'npx github-claude-workflow labels --setup');
    } else {
      labelsSpinner.succeed(`Labels ✓ ${labelStatus.total}/16 configured`);
    }
    results.labels = labelStatus;
  } catch (error) {
    labelsSpinner.fail(`Labels ✗ ${error.message}`);
    results.labels = { valid: false, error: error.message };
    allValid = false;
  }

  // Secrets validation  
  const secretsSpinner = ora('Checking repository secrets...').start();
  try {
    const secretStatus = await validateSecrets();
    if (!secretStatus.hasAnthropicKey) {
      secretsSpinner.warn('Secrets ⚠️  ANTHROPIC_API_KEY not configured');
      console.log(chalk.cyan('  Fix with:'), 'gh secret set ANTHROPIC_API_KEY');
    } else {
      secretsSpinner.succeed('Secrets ✓ ANTHROPIC_API_KEY configured');
    }
    results.secrets = secretStatus;
  } catch (error) {
    secretsSpinner.fail(`Secrets ✗ ${error.message}`);
    results.secrets = { valid: false, error: error.message };
    allValid = false;
  }

  // Summary
  console.log('\n' + chalk.bold('Validation Summary:'));
  if (allValid) {
    console.log(chalk.green.bold('✅ All validations passed! Your workflow is ready to use.'));
    console.log(chalk.blue('\nNext steps:'));
    console.log('1. Create an issue in your repository');  
    console.log('2. Comment: @claude-dev-truefrontier');
  } else {
    console.log(chalk.red.bold('❌ Some validations failed. Fix the issues above and run validation again.'));
    console.log(chalk.cyan('\nQuick fixes:'));
    console.log('• Run: npx github-claude-workflow init');
    console.log('• Or fix individual components using the suggestions above');
  }

  return results;
}

module.exports = { validateCommand };