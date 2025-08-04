import fs from 'fs';
import path from 'path';
import { GitHubConfig } from './github.js';

interface StoredConfig {
  github?: {
    token?: string;
    owner?: string;
    repo?: string;
    baseBranch?: string;
    headBranch?: string | 'current';
  };
  anthropic?: {
    apiKey?: string;
  };
}

export class ConfigManager {
  private configPath: string;
  private config: StoredConfig;

  constructor() {
    this.configPath = path.join(process.cwd(), '.pr-generator.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): StoredConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load config file:', error);
    }
    return {};
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.warn('Failed to save config file:', error);
    }
  }

  getGitHubConfig(): Partial<GitHubConfig> {
    return this.config.github || {};
  }

  setGitHubConfig(config: Partial<GitHubConfig>): void {
    this.config.github = { ...this.config.github, ...config };
    this.saveConfig();
  }

  getAnthropicApiKey(): string | undefined {
    return this.config.anthropic?.apiKey;
  }

  setAnthropicApiKey(apiKey: string): void {
    if (!this.config.anthropic) {
      this.config.anthropic = {};
    }
    this.config.anthropic.apiKey = apiKey;
    this.saveConfig();
  }

  hasCompleteGitHubConfig(): boolean {
    const github = this.config.github;
    return !!(github?.token && github?.owner && github?.repo);
  }

  getConfigPath(): string {
    return this.configPath;
  }

  clearConfig(): void {
    this.config = {};
    if (fs.existsSync(this.configPath)) {
      fs.unlinkSync(this.configPath);
    }
  }
} 