export interface GitChanges {
  files: ChangedFile[];
  summary: string;
  branchName: string;
  baseBranch: string;
}

export interface ChangedFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  diff: string;
  content?: string;
}

export interface BackendEndpoint {
  method: string;
  path: string;
  description: string;
  changes: string[];
}

export interface PRGenerationOptions {
  generateDiagram?: boolean;
  includeTestingNotes?: boolean;
  includeReviewNotes?: boolean;
}

export interface AnthropicResponse {
  content: string;
  diagram?: string;
} 