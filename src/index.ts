#!/usr/bin/env node

import { Command } from 'commander';
import { generatePR } from './generator';
import { setupGit, getChanges } from './git';
import chalk from 'chalk';

const program = new Command();

program
  .name('pr-gen')
  .description('Generate pull request descriptions using Anthropic API')
  .version('1.0.0')
  .option('-k, --api-key <key>', 'Anthropic API key')
  .option('-b, --base-branch <branch>', 'Base branch to compare against', 'main')
  .option('-o, --output <file>', 'Output file for the PR description')
  .option('--no-diagram', 'Skip generating diagrams')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting PR Generator...'));
      
      const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('❌ Anthropic API key is required. Use --api-key or set ANTHROPIC_API_KEY environment variable.'));
        process.exit(1);
      }

      const changes = await getChanges(options.baseBranch);
      
      if (changes.files.length === 0) {
        console.log(chalk.yellow('⚠️  No changes detected compared to base branch.'));
        return;
      }

      console.log(chalk.green(`📝 Found ${changes.files.length} changed files`));
      
      const prDescription = await generatePR(changes, apiKey, {
        generateDiagram: options.diagram !== false
      });

      if (options.output) {
        const fs = require('fs');
        fs.writeFileSync(options.output, prDescription);
        console.log(chalk.green(`✅ PR description saved to ${options.output}`));
      } else {
        console.log(chalk.cyan('\n📋 Generated PR Description:'));
        console.log(chalk.gray('─'.repeat(80)));
        console.log(prDescription);
        console.log(chalk.gray('─'.repeat(80)));
        console.log(chalk.yellow('\n💡 Copy the content above to use in your GitHub PR'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse(); 