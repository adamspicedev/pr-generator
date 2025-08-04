import Anthropic from '@anthropic-ai/sdk';
export async function generateMermaidDiagram(changes, backendEndpoints) {
    if (backendEndpoints.length === 0) {
        return null;
    }
    const anthropic = new Anthropic({
        apiKey: 'v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',
    });
    const endpointDetails = backendEndpoints.map(path => {
        const file = changes.files.find(f => f.path === path);
        return {
            path,
            diff: file?.diff || '',
            additions: file?.additions || 0,
            deletions: file?.deletions || 0
        };
    });
    const prompt = `Analyze the following backend API endpoint changes and create a Mermaid sequence diagram showing the API flow.

Backend endpoints modified:
${endpointDetails.map(ep => `- ${ep.path} (+${ep.additions}, -${ep.deletions})
  Diff: ${ep.diff.substring(0, 500)}${ep.diff.length > 500 ? '...' : ''}`).join('\n')}

Please create a Mermaid sequence diagram that shows:
1. The client making requests to the modified endpoints
2. The server processing these requests
3. Any database or external service interactions
4. The response flow back to the client

Use the following Mermaid syntax:
\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant D as Database
    participant E as External Service

    C->>S: Request
    S->>D: Query
    D-->>S: Response
    S-->>C: Response
\`\`\`

Focus on the main API flow and any significant changes. Make it clear and easy to understand.`;
    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });
        const content = response.content[0];
        if (content.type !== 'text') {
            return null;
        }
        // Extract the Mermaid diagram from the response
        const mermaidMatch = content.text.match(/```mermaid\n([\s\S]*?)\n```/);
        if (mermaidMatch) {
            return mermaidMatch[1];
        }
        // If no mermaid block found, try to extract just the diagram content
        const lines = content.text.split('\n');
        const diagramLines = [];
        let inDiagram = false;
        for (const line of lines) {
            if (line.includes('sequenceDiagram')) {
                inDiagram = true;
                diagramLines.push(line);
            }
            else if (inDiagram && line.trim() === '```') {
                break;
            }
            else if (inDiagram) {
                diagramLines.push(line);
            }
        }
        return diagramLines.length > 0 ? diagramLines.join('\n') : null;
    }
    catch (error) {
        console.warn('Failed to generate diagram:', error);
        return null;
    }
}
//# sourceMappingURL=diagram.js.map