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
    `
Use this tool when writing, modifying, or debugging code that defines agents using the @inkeep/agents-sdk package.

This includes cases where the user is "vibe-coding" or wanting to create agents, or is asking to modify existing agents defined with the @inkeep/agents-sdk.

This tool provides essential conceptual guidance and an architectural overview of the Inkeep Agents SDK, as well as type definitions with documentation of the SDK.

Call this tool proactively during your planning or initial steps so you can ground your reasoning and understanding of how the @inkeep/agents-sdk works.
    `,
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
