const chalk = require('chalk');

function helpCommand() {
  console.log(chalk.blue.bold('\n🚀 GitHub Claude Workflow Setup Guide'));
  console.log('=====================================\n');

  console.log(chalk.bold('Prerequisites:'));
  console.log('• GitHub repository with Issues enabled');
  console.log('• GitHub CLI (gh) installed and authenticated');
  console.log('• ANTHROPIC_API_KEY secret configured in repository');
  console.log('• @claude-dev-truefrontier added as repository collaborator\n');

  console.log(chalk.bold('Quick Start:'));
  console.log(chalk.cyan('npx github-claude-workflow init') + ' - Initialize workflow in current repo');
  console.log(chalk.cyan('npx github-claude-workflow validate') + ' - Check current setup');
  console.log(chalk.cyan('npx github-claude-workflow labels --setup') + ' - Create required labels\n');

  console.log(chalk.bold('Workflow Stages:'));
  console.log('🔍 ' + chalk.blue('Triage') + '    - Analyzes issue and creates task list');
  console.log('📝 ' + chalk.magenta('Spec') + '       - Creates BDD specification (optional)');
  console.log('🏗️ ' + chalk.yellow('Architect') + '  - Designs technical architecture (optional)');
  console.log('💻 ' + chalk.green('Develop') + '    - Implements code with full testing (required)\n');

  console.log(chalk.bold('Human Control:'));
  console.log('• Approve: Check boxes and mention @claude-dev-truefrontier');
  console.log('• Changes: Describe revisions and mention the bot');
  console.log('• Skip: "@claude-dev-truefrontier skip to develop"');
  console.log('• Stop: "@claude-dev-truefrontier stop"\n');

  console.log(chalk.bold('Getting Started:'));
  console.log('1. Run: ' + chalk.cyan('npx github-claude-workflow init'));
  console.log('2. Create an issue describing a feature or bug');
  console.log('3. Comment: @claude-dev-truefrontier');
  console.log('4. Follow the AI-guided workflow!\n');

  console.log(chalk.yellow('Need more help? Visit: https://github.com/your-org/github-claude-workflow'));
}

module.exports = { helpCommand };