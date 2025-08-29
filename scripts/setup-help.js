#!/usr/bin/env node

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const c = (color, text) => process.stdout.isTTY ? `${colors[color]}${text}${colors.reset}` : text;

console.log(c('blue', '\n🚀 GitHub Claude Workflow Setup Guide'));
console.log('=====================================\n');

console.log(c('bright', 'Prerequisites:'));
console.log('• GitHub repository with Issues enabled');
console.log('• GitHub CLI (gh) installed and authenticated');
console.log('• ANTHROPIC_API_KEY secret configured in repository');
console.log('• @claude-dev-truefrontier added as repository collaborator\n');

console.log(c('bright', 'Installation Steps:'));
console.log('1. Copy workflow files to .github/workflows/');
console.log('2. Configure ANTHROPIC_API_KEY secret:');
console.log(c('cyan', '   gh secret set ANTHROPIC_API_KEY'));
console.log('3. Setup required labels:');
console.log(c('cyan', '   npm run setup:labels'));
console.log('4. Add collaborator:');
console.log(c('cyan', '   gh repo add-collaborator claude-dev-truefrontier'));
console.log('5. Create your first issue and mention @claude-dev-truefrontier\n');

console.log(c('bright', 'Quick Start:'));
console.log('• Create an issue describing a feature or bug');
console.log('• Comment: @claude-dev-truefrontier');
console.log('• The AI will start with triage analysis');
console.log('• Review and approve each stage as needed\n');

console.log(c('bright', 'Available Commands:'));
console.log(c('green', 'npm run setup:labels') + '  - Setup GitHub labels');
console.log(c('green', 'npm run docs:labels') + '   - Show label documentation');
console.log(c('green', 'npm run setup:help') + '    - Show this help\n');

console.log(c('bright', 'Workflow Stages:'));
console.log('🔍 ' + c('blue', 'Triage') + '    - Analyzes issue and creates task list');
console.log('📝 ' + c('magenta', 'Spec') + '       - Creates BDD specification (optional)');
console.log('🏗️ ' + c('yellow', 'Architect') + '  - Designs technical architecture (optional)');
console.log('💻 ' + c('green', 'Develop') + '    - Implements code with full testing (required)\n');

console.log(c('bright', 'Human Control:'));
console.log('• Approve: Check boxes and mention @claude-dev-truefrontier');
console.log('• Changes: Describe revisions and mention the bot');
console.log('• Skip: "@claude-dev-truefrontier skip to develop"');
console.log('• Stop: "@claude-dev-truefrontier stop"\n');

console.log(c('yellow', 'Need help? Check the README.md for detailed documentation.'));
console.log(c('blue', 'Ready to start? Create an issue and mention @claude-dev-truefrontier!\n'));