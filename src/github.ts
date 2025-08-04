import { Octokit } from '@octokit/rest';
import inquirer from 'inquirer';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
  headBranch: string;
}

export interface PRData {
  title: string;
  body: string;
  base: string;
  head: string;
}

export async function getGitHubConfig(): Promise<GitHubConfig | null> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: 'Enter your GitHub Personal Access Token:',
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
      default: 'main'
    },
    {
      type: 'input',
      name: 'headBranch',
      message: 'Enter the head branch (current branch):',
      default: async () => {
        const { execSync } = await import('child_process');
        try {
          return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        } catch {
          return 'main';
        }
      }
    }
  ]);

  return {
    token: answers.token,
    owner: answers.owner,
    repo: answers.repo,
    baseBranch: answers.baseBranch,
    headBranch: answers.headBranch
  };
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

    const prData: PRData = {
      title,
      body,
      base: config.baseBranch,
      head: config.headBranch
    };

    // Check if PR already exists
    const existingPRs = await octokit.pulls.list({
      owner: config.owner,
      repo: config.repo,
      state: 'open',
      head: `${config.owner}:${config.headBranch}`
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