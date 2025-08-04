"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGit = setupGit;
exports.getChanges = getChanges;
exports.detectBackendEndpoints = detectBackendEndpoints;
exports.detectFrontendChanges = detectFrontendChanges;
const simple_git_1 = __importDefault(require("simple-git"));
function setupGit() {
    return (0, simple_git_1.default)();
}
async function getChanges(baseBranch = 'main') {
    const git = setupGit();
    try {
        // Get current branch
        const currentBranch = await git.branch();
        const branchName = currentBranch.current;
        // Get diff against base branch
        const diffSummary = await git.diffSummary([`${baseBranch}...HEAD`]);
        // Get list of changed files
        const changedFiles = await git.diffSummary([`${baseBranch}...HEAD`]);
        const files = [];
        for (const file of changedFiles.files) {
            // Check if this is a text file with changes
            if ('changes' in file && file.changes > 0) {
                // Get the actual diff for this file
                const fileDiff = await git.diff([`${baseBranch}...HEAD`, '--', file.file]);
                files.push({
                    path: file.file,
                    status: 'modified',
                    additions: 'insertions' in file ? file.insertions : 0,
                    deletions: 'deletions' in file ? file.deletions : 0,
                    diff: fileDiff,
                    content: await getFileContent(file.file)
                });
            }
            else if ('insertions' in file && (file.insertions > 0 || file.deletions > 0)) {
                // Handle files that might not have 'changes' property but have insertions/deletions
                const fileDiff = await git.diff([`${baseBranch}...HEAD`, '--', file.file]);
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
        const summary = `Changes in ${files.length} files: ${diffSummary.insertions} additions, ${diffSummary.deletions} deletions`;
        return {
            files,
            summary,
            branchName,
            baseBranch
        };
    }
    catch (error) {
        throw new Error(`Failed to get git changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function getFileContent(filePath) {
    try {
        const git = setupGit();
        return await git.show([`HEAD:${filePath}`]);
    }
    catch {
        // File might not exist in HEAD or might be new
        return undefined;
    }
}
function detectBackendEndpoints(files) {
    const backendFiles = files.filter(file => file.path.includes('/api/') ||
        file.path.includes('/routes/') ||
        file.path.includes('/controllers/') ||
        file.path.includes('/endpoints/') ||
        file.path.endsWith('.js') && file.path.includes('server') ||
        file.path.endsWith('.ts') && file.path.includes('server'));
    return backendFiles.map(file => file.path);
}
function detectFrontendChanges(files) {
    const frontendFiles = files.filter(file => file.path.includes('/components/') ||
        file.path.includes('/pages/') ||
        file.path.includes('/hooks/') ||
        file.path.includes('/utils/') ||
        file.path.endsWith('.jsx') ||
        file.path.endsWith('.tsx') ||
        file.path.endsWith('.vue') ||
        file.path.endsWith('.svelte'));
    return frontendFiles.map(file => file.path);
}
//# sourceMappingURL=git.js.map