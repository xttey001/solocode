#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('========================================');
console.log('  Local Factor Mining & Genetic Algorithm');
console.log('========================================\n');

const scriptPath = path.join(__dirname, 'runFactorMining.ts');
const args = process.argv.slice(2).join(' ');

try {
  console.log('Checking for ts-node...');
  execSync('ts-node --version', { stdio: 'ignore' });
  console.log('ts-node found!\n');
  
  const command = `ts-node ${scriptPath} ${args}`;
  console.log(`Running: ${command}\n`);
  execSync(command, { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.log('ts-node not found. Installing ts-node...\n');
  
  try {
    console.log('Installing ts-node and dependencies...');
    execSync('npm install -g ts-node typescript @types/node', { stdio: 'inherit' });
    
    const command = `ts-node ${scriptPath} ${args}`;
    console.log(`\nRunning: ${command}\n`);
    execSync(command, { stdio: 'inherit', cwd: __dirname });
  } catch (installError) {
    console.error('\nFailed to install or run ts-node.');
    console.error('\nPlease install manually:');
    console.error('  npm install -g ts-node typescript @types/node');
    console.error('\nThen run:');
    console.error('  cd /workspace/scripts');
    console.error('  ts-node runFactorMining.ts');
    process.exit(1);
  }
}
