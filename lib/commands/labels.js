const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');

const WORKFLOW_LABELS = [
  // needs:* labels (AI working) - Light cream/beige
  { name: 'needs:specify', description: 'AI is creating software specifications using GitHub spec-kit methodology', color: 'F9F8F3' },
  { name: 'needs:specify-revision', description: 'AI is revising software specifications based on feedback', color: 'F9F8F3' },
  { name: 'needs:plan', description: 'AI is creating technical implementation plan', color: 'F9F8F3' },
  { name: 'needs:plan-revision', description: 'AI is revising technical plan based on feedback', color: 'F9F8F3' },
  { name: 'needs:develop', description: 'AI is implementing code following approved specs and plan', color: 'F9F8F3' },
  { name: 'needs:develop-revision', description: 'AI is revising implementation based on feedback', color: 'F9F8F3' },

  // review:* labels (human review required) - Dark blue
  { name: 'review:specify', description: 'Software specifications ready for human review', color: '1e3a8a' },
  { name: 'review:plan', description: 'Technical implementation plan ready for human review', color: '1e3a8a' },
  { name: 'review:develop', description: 'Implementation ready for human review', color: '1e3a8a' },

  // error:* labels (needs human intervention) - Dark red
  { name: 'error:specify', description: 'Specification stage encountered an error', color: '991b1b' },
  { name: 'error:plan', description: 'Planning stage encountered an error', color: '991b1b' },
  { name: 'error:develop', description: 'Development stage encountered an error', color: '991b1b' }
];

async function labelsCommand(options) {
  if (options.setup) {
    await setupLabels();
  } else if (options.list) {
    listLabels();
  } else if (options.clean) {
    await cleanLabels();
  } else {
    // Default: show labels info
    listLabels();
  }
}

async function setupLabels() {
  console.log(chalk.blue.bold('\n🏷️  Setting up GitHub workflow labels\n'));
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const label of WORKFLOW_LABELS) {
    const spinner = ora(`Creating label: ${label.name}`).start();
    
    try {
      // Try to create the label
      execSync(`gh label create "${label.name}" --description "${label.description}" --color "${label.color}"`, {
        stdio: 'pipe'
      });
      spinner.succeed(`Created: ${label.name}`);
      created++;
    } catch (error) {
      // Label might already exist, try to update it
      try {
        execSync(`gh label edit "${label.name}" --description "${label.description}" --color "${label.color}"`, {
          stdio: 'pipe'
        });
        spinner.succeed(`Updated: ${label.name}`);
        updated++;
      } catch (updateError) {
        spinner.fail(`Failed: ${label.name}`);
        errors++;
      }
    }
  }
  
  console.log(chalk.green.bold(`\n✅ Label setup complete!`));
  console.log(`📊 Results: ${created} created, ${updated} updated, ${errors} errors\n`);
  
  if (errors === 0) {
    console.log(chalk.blue('Next steps:'));
    console.log('1. Create an issue describing your feature or bug');
    console.log('2. Comment: @claude-dev-truefrontier');
    console.log('3. The workflow will automatically start with \'needs:triage\' label');
  }
}

function listLabels() {
  console.log(chalk.blue.bold('\n🏷️  GitHub Claude Workflow Labels\n'));
  
  console.log(chalk.blue.bold('🔵 needs:* (AI working):'));
  WORKFLOW_LABELS.filter(l => l.name.startsWith('needs:')).forEach(label => {
    console.log(`  • ${chalk.cyan(label.name)} - ${label.description}`);
  });
  
  console.log(chalk.green.bold('\n🟢 review:* (human review):'));
  WORKFLOW_LABELS.filter(l => l.name.startsWith('review:')).forEach(label => {
    console.log(`  • ${chalk.green(label.name)} - ${label.description}`);
  });
  
  console.log(chalk.red.bold('\n🔴 error:* (needs help):'));
  WORKFLOW_LABELS.filter(l => l.name.startsWith('error:')).forEach(label => {
    console.log(`  • ${chalk.red(label.name)} - ${label.description}`);
  });
  
  console.log(chalk.yellow.bold('\n⚠️  Important:'));
  console.log('Only one workflow label should be active per issue at a time\n');
  
  console.log(chalk.cyan('Commands:'));
  console.log('• npx @truefrontier/claude-dev-workflow labels --setup  (create all labels)');
  console.log('• npx @truefrontier/claude-dev-workflow labels --clean  (remove all labels)');
}

async function cleanLabels() {
  console.log(chalk.yellow.bold('\n⚠️  Removing all workflow labels\n'));
  
  let removed = 0;
  let errors = 0;
  
  for (const label of WORKFLOW_LABELS) {
    const spinner = ora(`Removing label: ${label.name}`).start();
    
    try {
      execSync(`gh label delete "${label.name}" --yes`, { stdio: 'pipe' });
      spinner.succeed(`Removed: ${label.name}`);
      removed++;
    } catch (error) {
      spinner.warn(`Not found: ${label.name}`);
      errors++;
    }
  }
  
  console.log(chalk.yellow.bold(`\n🧹 Cleanup complete!`));
  console.log(`📊 Results: ${removed} removed, ${errors} not found\n`);
}

module.exports = { labelsCommand, setupLabels, WORKFLOW_LABELS };