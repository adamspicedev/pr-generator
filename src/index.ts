#!/usr/bin/env node

import { Command } from 'commander';
import { generatePR } from './generator.js';
import { getChanges } from './git.js';
import { generateDemoPR } from './demo.js';
import { promptForGitHubPublish, getGitHubConfig, detectCurrentRepo } from './github.js';
import { ConfigManager } from './config.js';
import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('pr-gen')
  .description('Generate pull request descriptions using Anthropic API')
  .version('1.0.0')
  .option('-k, --api-key <key>', 'Anthropic API key')
  .option('-b, --base-branch <branch>', 'Base branch to compare against', 'main')
  .option('-o, --output <file>', 'Output file for the PR description')
  .option('--no-diagram', 'Skip generating diagrams')
  .option('--demo', 'Run in demo mode with sample data')
  .option('--no-publish', 'Skip GitHub publishing prompt')
  .option('--config', 'Manage stored configuration')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting PR Generator...'));
      
      if (options.config) {
        await manageConfig();
        return;
      }
      
      if (options.demo) {
        console.log(chalk.yellow('🎭 Running in demo mode...'));
        const prDescription = generateDemoPR();
        
        if (options.output) {
          fs.writeFileSync(options.output, prDescription);
          console.log(chalk.green(`✅ Demo PR description saved to ${options.output}`));
        } else {
          console.log(chalk.cyan('\n📋 Generated PR Description (Demo):'));
          console.log(chalk.gray('─'.repeat(80)));
          console.log(prDescription);
          console.log(chalk.gray('─'.repeat(80)));
          console.log(chalk.yellow('\n💡 Copy the content above to use in your GitHub PR'));
        }
        
        // Offer to publish to GitHub
        if (options.publish !== false) {
          await promptForGitHubPublish(prDescription);
        }
        return;
      }
      
      const configManager = new ConfigManager();
      const storedApiKey = configManager.getAnthropicApiKey();
      const apiKey = options.apiKey || storedApiKey || process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        console.error(chalk.red('❌ Anthropic API key is required.'));
        console.log(chalk.yellow('💡 You can:'));
        console.log(chalk.yellow('   • Use --api-key to provide it directly'));
        console.log(chalk.yellow('   • Set ANTHROPIC_API_KEY environment variable'));
        console.log(chalk.yellow('   • Run with --demo to see how the tool works'));
        process.exit(1);
      }

      // Store the API key if it was provided via command line
      if (options.apiKey && !storedApiKey) {
        const { saveApiKey } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'saveApiKey',
            message: 'Save API key for future use?',
            default: true
          }
        ]);

        if (saveApiKey) {
          configManager.setAnthropicApiKey(options.apiKey);
        }
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
        fs.writeFileSync(options.output, prDescription);
        console.log(chalk.green(`✅ PR description saved to ${options.output}`));
      } else {
        console.log(chalk.cyan('\n📋 Generated PR Description:'));
        console.log(chalk.gray('─'.repeat(80)));
        console.log(prDescription);
        console.log(chalk.gray('─'.repeat(80)));
        console.log(chalk.yellow('\n💡 Copy the content above to use in your GitHub PR'));
      }
      
      // Offer to publish to GitHub
      if (options.publish !== false) {
        await promptForGitHubPublish(prDescription);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function manageConfig(): Promise<void> {
  const configManager = new ConfigManager();
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'View current configuration', value: 'view' },
        { name: 'Clear all configuration', value: 'clear' },
        { name: 'Set GitHub configuration', value: 'github' },
        { name: 'Set Anthropic API key', value: 'api' }
      ]
    }
  ]);

  switch (action) {
    case 'view': {
      const githubConfig = configManager.getGitHubConfig();
      const apiKey = configManager.getAnthropicApiKey();
      const currentRepo = await detectCurrentRepo();
      
      console.log(chalk.cyan('\n📋 Current Configuration:'));
      console.log(chalk.gray('─'.repeat(50)));
      
      if (Object.keys(githubConfig).length > 0) {
        console.log(chalk.green('GitHub Configuration:'));
        console.log(`  Owner: ${githubConfig.owner || 'Not set'}`);
        console.log(`  Repo: ${githubConfig.repo || 'Not set'}`);
        console.log(`  Base Branch: ${githubConfig.baseBranch || 'Not set'}`);
        console.log(`  Head Branch: ${githubConfig.headBranch === 'current' ? 'current (auto-detect)' : githubConfig.headBranch || 'Not set'}`);
        console.log(`  Token: ${githubConfig.token ? '***' + githubConfig.token.slice(-4) : 'Not set'}`);
      } else {
        console.log(chalk.yellow('GitHub Configuration: Not set'));
      }
      
      if (currentRepo) {
        console.log(chalk.blue('\nDetected Repository:'));
        console.log(`  Owner: ${currentRepo.owner}`);
        console.log(`  Repo: ${currentRepo.repo}`);
      }
      
      console.log(chalk.green('\nAnthropic API Key:'));
      console.log(`  ${apiKey ? '***' + apiKey.slice(-4) : 'Not set'}`);
      
      console.log(chalk.gray('\nConfig file: ' + configManager.getConfigPath()));
      break;
    }
      
    case 'clear': {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to clear all configuration?',
          default: false
        }
      ]);
      
      if (confirm) {
        configManager.clearConfig();
        console.log(chalk.green('✅ Configuration cleared successfully'));
      }
      break;
    }
      
    case 'github': {
      console.log(chalk.yellow('This will prompt you for GitHub configuration...'));
      // The getGitHubConfig function will handle the prompts
      await getGitHubConfig();
      console.log(chalk.green('✅ GitHub configuration saved'));
      break;
    }
      
    case 'api': {
      const { apiKey: newApiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your Anthropic API key:',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'API key is required';
            }
            return true;
          }
        }
      ]);
      
      configManager.setAnthropicApiKey(newApiKey);
      console.log(chalk.green('✅ API key saved successfully'));
      break;
    }
  }
}

program.parse(); 