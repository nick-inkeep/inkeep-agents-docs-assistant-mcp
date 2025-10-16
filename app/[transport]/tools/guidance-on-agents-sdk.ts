import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read the type definitions directly from the @inkeep/agents-sdk package
const guidanceContentPath = join(process.cwd(), 'node_modules/@inkeep/agents-sdk/dist/index.d.ts');
const agentsSdkGuidanceContent = readFileSync(guidanceContentPath, 'utf-8');

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
