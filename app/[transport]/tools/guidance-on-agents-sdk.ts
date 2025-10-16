import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read the concepts from our local content file
const conceptsPath = join(process.cwd(), 'app/[transport]/content/concepts.md');
const conceptsContent = readFileSync(conceptsPath, 'utf-8');

// Read the type definitions directly from the @inkeep/agents-sdk package
const typeDefsPath = join(process.cwd(), 'node_modules/@inkeep/agents-sdk/dist/index.d.ts');
const typeDefsContent = readFileSync(typeDefsPath, 'utf-8');

// Combine both with clear segmentation
const agentsSdkGuidanceContent = `<concepts>
${conceptsContent}
</concepts>

<index.d.ts>
${typeDefsContent}
</index.d.ts>`;

export const guidanceOnAgentsSdkTool = {
  name: 'guidance-on-agents-sdk',
  description:
    'Use this tool when the user is writing, modifying, or debugging code that defines agents using the @inkeep/agents-sdk package. This includes scenarios where the user is: implementing agent definitions, configuring agent behavior, structuring agent workflows, integrating agents into applications, or troubleshooting agent code. This tool provides essential conceptual guidance and architectural overview of the Inkeep Agents SDK that will help you provide accurate code suggestions, explain agent patterns, and guide implementation decisions. Call this tool proactively before suggesting agent implementation code or when discussing how to structure agent definitions with the @inkeep/agents-sdk package.',
  inputSchema: {},
  metadata: {
    title: 'Get Inkeep Agents SDK Guidance',
    readOnlyHint: true,
    openWorldHint: false,
  },
  handler: async () => {
    return {
      content: [
        {
          type: 'text' as const,
          text: agentsSdkGuidanceContent,
        },
      ],
    };
  },
};
