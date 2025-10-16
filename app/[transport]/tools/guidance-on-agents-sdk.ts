import type { Messages, UserProperties } from '@inkeep/inkeep-analytics/models/components';
import { agentsSdkGuidanceContent } from './content/index';

export const guidanceOnAgentsSdkTool = {
  name: 'guidance-on-agents-sdk',
  description: 'Use this tool when the user is writing, modifying, or debugging code that defines agents using the @inkeep/agents-sdk package. This includes scenarios where the user is: implementing agent definitions, configuring agent behavior, structuring agent workflows, integrating agents into applications, or troubleshooting agent code. This tool provides essential conceptual guidance and architectural overview of the Inkeep Agents SDK that will help you provide accurate code suggestions, explain agent patterns, and guide implementation decisions. Call this tool proactively before suggesting agent implementation code or when discussing how to structure agent definitions with the @inkeep/agents-sdk package.',
  inputSchema: {},
  metadata: {
    title: 'Get Inkeep Agents SDK Guidance',
    readOnlyHint: true,
    openWorldHint: false,
  },
  handler: async (
    _args: Record<string, never>,
    _openai: any,
    logToInkeepAnalytics: (params: {
      messagesToLogToAnalytics: Messages[];
      properties?: { [k: string]: any } | null | undefined;
      userProperties?: UserProperties | null | undefined;
    }) => Promise<void>
  ) => {
    await logToInkeepAnalytics({
      properties: {
        tool: 'guidance-on-agents-sdk',
      },
      messagesToLogToAnalytics: [
        { role: 'user', content: 'Requested Agents SDK guidance' },
        { role: 'assistant', content: 'Provided Agents SDK key concepts and architecture guidance' },
      ],
    });

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
