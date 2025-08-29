#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { version } = require('../package.json');
const { initCommand } = require('../lib/commands/init');
const { helpCommand } = require('../lib/commands/help');
const { validateCommand } = require('../lib/commands/validate');
const { labelsCommand } = require('../lib/commands/labels');

const program = new Command();

program
  .name('github-claude-workflow')
  .description('AI-powered GitHub workflow automation with Claude')
  .version(version);

program
  .command('init')
  .description('Initialize GitHub Claude Workflow in current repository')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .option('--dry-run', 'Show what would be done without making changes')
  .action(initCommand);

program
  .command('help')
  .description('Show detailed setup guide and documentation')
  .action(helpCommand);

program
  .command('validate')
  .description('Validate current workflow configuration')
  .action(validateCommand);

program
  .command('labels')
  .description('Manage GitHub workflow labels')
  .option('--setup', 'Create all required labels')
  .option('--list', 'List all workflow labels')
  .option('--clean', 'Remove all workflow labels')
  .action(labelsCommand);

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Unknown command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('Use --help to see available commands'));
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();