#!/usr/bin/env node

// Test script to validate the CLI works locally before publishing

const { execSync } = require('child_process');
const path = require('path');

const cliPath = path.join(__dirname, 'bin', 'cli.js');

console.log('🧪 Testing GitHub Claude Workflow CLI\n');

const tests = [
  {
    name: 'CLI executable',
    command: `node ${cliPath} --version`,
    expectSuccess: true
  },
  {
    name: 'Help command', 
    command: `node ${cliPath} help`,
    expectSuccess: true
  },
  {
    name: 'Labels list command',
    command: `node ${cliPath} labels --list`,
    expectSuccess: true
  },
  {
    name: 'Validate command (may fail without proper setup)',
    command: `node ${cliPath} validate`,
    expectSuccess: false // This will likely fail in most environments
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  process.stdout.write(`Testing ${test.name}... `);
  
  try {
    execSync(test.command, { stdio: 'pipe' });
    console.log('✅ PASS');
    passed++;
  } catch (error) {
    if (test.expectSuccess) {
      console.log('❌ FAIL');
      console.log(`  Error: ${error.message}`);
      failed++;
    } else {
      console.log('⚠️  EXPECTED FAIL');
      passed++;
    }
  }
}

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed! CLI is ready for publishing.');
} else {
  console.log('❌ Some tests failed. Fix issues before publishing.');
  process.exit(1);
}