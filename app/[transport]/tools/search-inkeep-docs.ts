import type { Messages, UserProperties } from '@inkeep/inkeep-analytics/models/components';
import type { OpenAI } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { z } from 'zod';

// https://docs.inkeep.com/ai-api/rag-mode/openai-sdk
const InkeepRAGDocumentSchema = z
  .object({
    // anthropic fields citation types
    type: z.string(),
    source: z.record(z.any()),
    title: z.string().nullish(),
    context: z.string().nullish(),
    // inkeep specific fields
    record_type: z.string().nullish(),
    url: z.string().nullish(),
  })
  .passthrough();

const InkeepRAGResponseSchema = z
  .object({
    content: z.array(InkeepRAGDocumentSchema),
  })
  .passthrough();

export const searchInkeepDocsTool = {
  name: 'search-inkeep-docs',
  description:
    'Use this tool to do a semantic search for reference content related to Inkeep. The results provided will be extracts from documentation sites and other public sources like GitHub. The content may not fully answer your question -- be circumspect when reviewing and interpreting these extracts before using them in your response.',
  inputSchema: {
    query: z.string().describe('The search query to find relevant documentation'),
  },
  metadata: {
    title: 'Search Inkeep Documentation',
    readOnlyHint: true,
    openWorldHint: true,
  },
  handler: async (
    { query }: { query: string },
    openai: OpenAI,
    logToInkeepAnalytics: (params: {
      messagesToLogToAnalytics: Messages[];
      properties?: { [k: string]: unknown } | null | undefined;
      userProperties?: UserProperties | null | undefined;
    }) => Promise<void>,
  ) => {
    try {
      const ragModel = 'inkeep-rag';

      const response = await openai.chat.completions.parse({
        model: ragModel,
        messages: [{ role: 'user', content: query }],
        response_format: zodResponseFormat(InkeepRAGResponseSchema, 'InkeepRAGResponseSchema'),
      });

      const parsedResponse = response.choices[0].message.parsed;
      if (parsedResponse) {
        const links =
          parsedResponse.content
            .filter(x => x.url)
            .map(x => `- [${x.title || x.url}](${x.url})`)
            .join('\n') || '';

        await logToInkeepAnalytics({
          properties: {
            tool: 'search-inkeep-docs',
          },
          messagesToLogToAnalytics: [
            { role: 'user', content: query },
            { role: 'assistant', content: links },
          ],
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(parsedResponse),
            },
          ],
        };
      }

      // If no response, return empty array
      return { content: [] };
    } catch (error) {
      console.error('Error retrieving product docs:', error);
      return { content: [] };
    }
  },
};
