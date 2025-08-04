import simpleGit, { SimpleGit } from 'simple-git';
import { GitChanges, ChangedFile } from './types.js';

export function setupGit(): SimpleGit {
  return simpleGit();
}

export async function getChanges(baseBranch: string = 'main'): Promise<GitChanges> {
  const git = setupGit();
  
  try {
    // Get current branch
    const currentBranch = await git.branch();
    const branchName = currentBranch.current;
    
    // Get diff against base branch, excluding node_modules and other unnecessary files
    const diffSummary = await git.diffSummary([
      `${baseBranch}...HEAD`,
      '--',
      ':!node_modules',
      ':!dist',
      ':!*.lock',
      ':!package-lock.json',
      ':!bun.lock'
    ]);
    
    // Get list of changed files, excluding node_modules and other unnecessary files
    const changedFiles = await git.diffSummary([
      `${baseBranch}...HEAD`,
      '--',
      ':!node_modules',
      ':!dist',
      ':!*.lock',
      ':!package-lock.json',
      ':!bun.lock'
    ]);
    
    const files: ChangedFile[] = [];
    
    // Limit to first 50 files to prevent token limit issues
    const filesToProcess = changedFiles.files.slice(0, 50);
    
    for (const file of filesToProcess) {
      // Check if this is a text file with changes
      if ('changes' in file && file.changes > 0) {
        // Get the actual diff for this file
        const fileDiff = await git.diff([
          `${baseBranch}...HEAD`,
          '--',
          file.file,
          ':!node_modules',
          ':!dist',
          ':!*.lock',
          ':!package-lock.json',
          ':!bun.lock'
        ]);
        
        files.push({
          path: file.file,
          status: 'modified',
          additions: 'insertions' in file ? file.insertions : 0,
          deletions: 'deletions' in file ? file.deletions : 0,
          diff: fileDiff,
          content: await getFileContent(file.file)
        });
      } else if ('insertions' in file && (file.insertions > 0 || file.deletions > 0)) {
        // Handle files that might not have 'changes' property but have insertions/deletions
        const fileDiff = await git.diff([
          `${baseBranch}...HEAD`,
          '--',
          file.file,
          ':!node_modules',
          ':!dist',
          ':!*.lock',
          ':!package-lock.json',
          ':!bun.lock'
        ]);
        
        files.push({
          path: file.file,
          status: 'modified',
          additions: file.insertions,
          deletions: file.deletions,
          diff: fileDiff,
          content: await getFileContent(file.file)
        });
      }
    }
    
    // Generate summary
    const totalFiles = changedFiles.files.length;
    const processedFiles = files.length;
    const summary = `Changes in ${processedFiles} files (showing first ${processedFiles} of ${totalFiles}): ${diffSummary.insertions} additions, ${diffSummary.deletions} deletions`;
    
    if (totalFiles > 50) {
      console.log(`⚠️  Warning: Found ${totalFiles} changed files, but only processing first 50 to avoid token limits.`);
    }
    
    return {
      files,
      summary,
      branchName,
      baseBranch
    };
  } catch (error) {
    throw new Error(`Failed to get git changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getFileContent(filePath: string): Promise<string | undefined> {
  try {
    const git = setupGit();
    return await git.show([`HEAD:${filePath}`]);
  } catch {
    // File might not exist in HEAD or might be new
    return undefined;
  }
}

export function detectBackendEndpoints(files: ChangedFile[]): string[] {
  const backendFiles = files.filter(file => 
    file.path.includes('/api/') || 
    file.path.includes('/routes/') || 
    file.path.includes('/controllers/') ||
    file.path.includes('/endpoints/') ||
    file.path.endsWith('.js') && file.path.includes('server') ||
    file.path.endsWith('.ts') && file.path.includes('server')
  );
  
  return backendFiles.map(file => file.path);
}

export function detectFrontendChanges(files: ChangedFile[]): string[] {
  const frontendFiles = files.filter(file => 
    file.path.includes('/components/') || 
    file.path.includes('/pages/') || 
    file.path.includes('/hooks/') ||
    file.path.includes('/utils/') ||
    file.path.endsWith('.jsx') ||
    file.path.endsWith('.tsx') ||
    file.path.endsWith('.vue') ||
    file.path.endsWith('.svelte')
  );
  
  return frontendFiles.map(file => file.path);
} 