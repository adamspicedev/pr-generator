#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const generator_1 = require("./generator");
const git_1 = require("./git");
const chalk_1 = __importDefault(require("chalk"));
const program = new commander_1.Command();
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
        console.log(chalk_1.default.blue('🚀 Starting PR Generator...'));
        const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.error(chalk_1.default.red('❌ Anthropic API key is required. Use --api-key or set ANTHROPIC_API_KEY environment variable.'));
            process.exit(1);
        }
        const changes = await (0, git_1.getChanges)(options.baseBranch);
        if (changes.files.length === 0) {
            console.log(chalk_1.default.yellow('⚠️  No changes detected compared to base branch.'));
            return;
        }
        console.log(chalk_1.default.green(`📝 Found ${changes.files.length} changed files`));
        const prDescription = await (0, generator_1.generatePR)(changes, apiKey, {
            generateDiagram: options.diagram !== false
        });
        if (options.output) {
            const fs = require('fs');
            fs.writeFileSync(options.output, prDescription);
            console.log(chalk_1.default.green(`✅ PR description saved to ${options.output}`));
        }
        else {
            console.log(chalk_1.default.cyan('\n📋 Generated PR Description:'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            console.log(prDescription);
            console.log(chalk_1.default.gray('─'.repeat(80)));
            console.log(chalk_1.default.yellow('\n💡 Copy the content above to use in your GitHub PR'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map