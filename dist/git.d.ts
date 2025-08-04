import { SimpleGit } from 'simple-git';
import { GitChanges, ChangedFile } from './types';
export declare function setupGit(): SimpleGit;
export declare function getChanges(baseBranch?: string): Promise<GitChanges>;
export declare function detectBackendEndpoints(files: ChangedFile[]): string[];
export declare function detectFrontendChanges(files: ChangedFile[]): string[];
//# sourceMappingURL=git.d.ts.map