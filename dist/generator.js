import Anthropic from '@anthropic-ai/sdk';
import { detectBackendEndpoints, detectFrontendChanges } from './git.js';
import { generateMermaidDiagram } from './diagram.js';
const ANTHROPIC_API_KEY = 'v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';
export async function generatePR(changes, apiKey, options = {}) {
    const anthropic = new Anthropic({
        apiKey: apiKey || ANTHROPIC_API_KEY,
    });
    const backendEndpoints = detectBackendEndpoints(changes.files);
    const frontendChanges = detectFrontendChanges(changes.files);
    const prompt = buildPrompt(changes, backendEndpoints, frontendChanges);
    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });
        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from Anthropic API');
        }
        let prDescription = content.text;
        // Generate diagram if requested and backend endpoints were detected
        if (options.generateDiagram && backendEndpoints.length > 0) {
            const diagram = await generateMermaidDiagram(changes, backendEndpoints);
            if (diagram) {
                prDescription += '\n\n## API Changes Diagram\n\n```mermaid\n' + diagram + '\n```';
            }
        }
        return prDescription;
    }
    catch (error) {
        throw new Error(`Failed to generate PR description: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function buildPrompt(changes, backendEndpoints, frontendChanges) {
    const fileDetails = changes.files.map(file => `File: ${file.path} (${file.status})
Additions: ${file.additions}, Deletions: ${file.deletions}
Diff:
${file.diff.substring(0, 1000)}${file.diff.length > 1000 ? '...' : ''}`).join('\n\n');
    const backendInfo = backendEndpoints.length > 0
        ? `\nBackend API endpoints modified: ${backendEndpoints.join(', ')}`
        : '';
    const frontendInfo = frontendChanges.length > 0
        ? `\nFrontend components modified: ${frontendChanges.join(', ')}`
        : '';
    return `You are a senior software engineer tasked with creating a comprehensive pull request description. 

Please analyze the following git changes and create a professional, well-structured PR description in Markdown format.

Branch: ${changes.branchName} → ${changes.baseBranch}
Summary: ${changes.summary}
${backendInfo}
${frontendInfo}

Changed Files:
${fileDetails}

Please create a PR description that includes:

1. **Title**: A clear, concise title that describes the main change
2. **Overview**: A brief summary of what this PR accomplishes
3. **Key Changes**: Detailed breakdown of the main changes, organized by category (e.g., Backend, Frontend, Infrastructure, etc.)
4. **Testing Considerations**: What should be tested and how
5. **Notes for Reviewers**: Any specific areas that need attention during review
6. **Impact**: What this change means for the system and users

The description should be:
- Professional and clear
- Well-structured with proper Markdown formatting
- Include specific details about the changes
- Highlight any breaking changes or important considerations
- Be comprehensive but concise

If backend API endpoints were modified, please include a section documenting the API changes with method, path, and description of what changed.

Format the response as clean Markdown that can be directly copied into a GitHub PR description.`;
}
//# sourceMappingURL=generator.js.map