import { Octokit } from '@octokit/rest';
import inquirer from 'inquirer';
import { ConfigManager } from './config.js';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
  headBranch: string | 'current';
}

export interface CurrentRepo {
  owner: string;
  repo: string;
}

export async function detectCurrentRepo(): Promise<CurrentRepo | null> {
  try {
    const { execSync } = await import('child_process');
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
  } catch {
    // Git remote not available or not a GitHub repo
  }
  return null;
}

export interface PRData {
  title: string;
  body: string;
  base: string;
  head: string;
}

export async function getGitHubConfig(): Promise<GitHubConfig | null> {
  const configManager = new ConfigManager();
  const storedConfig = configManager.getGitHubConfig();
  
  // Try to get current repo info from git remote
  const currentRepo = await detectCurrentRepo();
  
  // Check if we have complete stored config
  if (configManager.hasCompleteGitHubConfig()) {
    const { useStored } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useStored',
        message: `Use stored GitHub config? (${storedConfig.owner}/${storedConfig.repo})`,
        default: true
      }
    ]);

    if (useStored) {
      let headBranch = storedConfig.headBranch || 'main';
      
      // If headBranch is set to 'current', get the current branch
      if (headBranch === 'current') {
        try {
          const { execSync } = await import('child_process');
          headBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        } catch {
          headBranch = 'main';
        }
      }

      return {
        token: storedConfig.token!,
        owner: storedConfig.owner!,
        repo: storedConfig.repo!,
        baseBranch: storedConfig.baseBranch || 'main',
        headBranch
      };
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: 'Enter your GitHub Personal Access Token:',
      default: storedConfig.token,
      validate: (input: string) => {
        if (!input.trim()) {
          return 'GitHub token is required';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'owner',
      message: 'Enter the repository owner (username or organization):',
      default: currentRepo?.owner || storedConfig.owner,
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Repository owner is required';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'repo',
      message: 'Enter the repository name:',
      default: currentRepo?.repo || storedConfig.repo,
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Repository name is required';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'baseBranch',
      message: 'Enter the base branch (default: main):',
      default: storedConfig.baseBranch || 'main'
    },
    {
      type: 'list',
      name: 'headBranch',
      message: 'Select the head branch:',
      choices: [
        { name: 'Use current branch (auto-detect)', value: 'current' },
        { name: 'Enter specific branch name', value: 'custom' }
      ]
    },
    {
      type: 'input',
      name: 'customHeadBranch',
      message: 'Enter the head branch name:',
      when: (answers) => answers.headBranch === 'custom',
      default: async () => {
        try {
          const { execSync } = await import('child_process');
          return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        } catch {
          return 'main';
        }
      },
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Branch name is required';
        }
        return true;
      }
    }
  ]);

  const config = {
    token: answers.token,
    owner: answers.owner,
    repo: answers.repo,
    baseBranch: answers.baseBranch,
    headBranch: answers.headBranch === 'custom' ? answers.customHeadBranch : 'current'
  };

  // Store the configuration for future use
  const { saveConfig } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'saveConfig',
      message: 'Save this configuration for future use?',
      default: true
    }
  ]);

  if (saveConfig) {
    configManager.setGitHubConfig({
      token: config.token,
      owner: config.owner,
      repo: config.repo,
      baseBranch: config.baseBranch,
      headBranch: config.headBranch
    });
  }

  return config;
}

export async function publishPR(
  prDescription: string,
  config: GitHubConfig
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const octokit = new Octokit({
      auth: config.token
    });

    // Extract title from the first line of the description
    const lines = prDescription.split('\n');
    const title = lines[0].replace(/^#\s*/, '').trim();
    const body = lines.slice(1).join('\n').trim();

    // Resolve headBranch if it's set to 'current'
    let headBranch = config.headBranch;
    if (headBranch === 'current') {
      try {
        const { execSync } = await import('child_process');
        headBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      } catch {
        return {
          success: false,
          error: 'Failed to get current branch'
        };
      }
    }

    const prData: PRData = {
      title,
      body,
      base: config.baseBranch,
      head: headBranch
    };

    // Check if PR already exists
    const existingPRs = await octokit.pulls.list({
      owner: config.owner,
      repo: config.repo,
      state: 'open',
      head: `${config.owner}:${headBranch}`
    });

    if (existingPRs.data.length > 0) {
      const pr = existingPRs.data[0];
      // Update existing PR
      await octokit.pulls.update({
        owner: config.owner,
        repo: config.repo,
        pull_number: pr.number,
        title: prData.title,
        body: prData.body
      });

      return {
        success: true,
        url: pr.html_url
      };
    } else {
      // Create new PR
      const response = await octokit.pulls.create({
        owner: config.owner,
        repo: config.repo,
        title: prData.title,
        body: prData.body,
        base: prData.base,
        head: prData.head
      });

      return {
        success: true,
        url: response.data.html_url
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function promptForGitHubPublish(prDescription: string): Promise<void> {
  const { publishToGitHub } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'publishToGitHub',
      message: 'Would you like to publish this PR to GitHub?',
      default: false
    }
  ]);

  if (!publishToGitHub) {
    console.log('PR description generated successfully. You can copy it manually to GitHub.');
    return;
  }

  const config = await getGitHubConfig();
  if (!config) {
    console.log('GitHub configuration cancelled.');
    return;
  }

  console.log('Publishing PR to GitHub...');
  const result = await publishPR(prDescription, config);

  if (result.success) {
    console.log(`✅ PR published successfully!`);
    console.log(`🔗 View it here: ${result.url}`);
  } else {
    console.log(`❌ Failed to publish PR: ${result.error}`);
  }
} 