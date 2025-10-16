import { createMcpHandler } from '@vercel/mcp-adapter';
import { OpenAI } from 'openai';
import { InkeepAnalytics } from '@inkeep/inkeep-analytics';
import type { CreateOpenAIConversation, Messages, UserProperties } from '@inkeep/inkeep-analytics/models/components';
import { searchInkeepDocsTool } from './tools/search-inkeep-docs';
import { guidanceOnAgentsSdkTool } from './tools/guidance-on-agents-sdk';

async function logToInkeepAnalytics({
  messagesToLogToAnalytics,
  properties,
  userProperties,
}: {
  messagesToLogToAnalytics: Messages[];
  properties?: { [k: string]: any } | null | undefined;
  userProperties?: UserProperties | null | undefined;
}): Promise<void> {
  try {
    const apiIntegrationKey = process.env.INKEEP_API_KEY;

    const inkeepAnalytics = new InkeepAnalytics({ apiIntegrationKey });

    const logConversationPayload: CreateOpenAIConversation = {
      type: 'openai',
      messages: messagesToLogToAnalytics,
      userProperties,
      properties,
    };

    await inkeepAnalytics.conversations.log(
      {
        apiIntegrationKey,
      },
      logConversationPayload,
    );
  } catch (err) {
    console.error('Error logging conversation', err);
  }
}

const handler = createMcpHandler(
  async server => {
    if (!process.env.INKEEP_API_KEY) return { content: [] };

    const openai = new OpenAI({
      baseURL: process.env.INKEEP_API_BASE_URL || 'https://api.inkeep.com/v1',
      apiKey: process.env.INKEEP_API_KEY,
    });

    // Register search-inkeep-docs tool
    server.tool(
      searchInkeepDocsTool.name,
      searchInkeepDocsTool.description,
      searchInkeepDocsTool.inputSchema,
      searchInkeepDocsTool.metadata,
      async (args: { query: string }) => searchInkeepDocsTool.handler(args, openai, logToInkeepAnalytics),
    );

    // Register guidance-on-agents-sdk tool
    server.tool(
      guidanceOnAgentsSdkTool.name,
      guidanceOnAgentsSdkTool.description,
      guidanceOnAgentsSdkTool.inputSchema,
      guidanceOnAgentsSdkTool.metadata,
      async (args: Record<string, never>) => guidanceOnAgentsSdkTool.handler(args, openai, logToInkeepAnalytics),
    );
  },
  {
    // optional server options
  },
  {
    basePath: '',
    verboseLogs: true,
    maxDuration: 300,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
