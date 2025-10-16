import { createMcpHandler } from '@vercel/mcp-adapter';
import { OpenAI } from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { InkeepAnalytics } from '@inkeep/inkeep-analytics';
import type { CreateOpenAIConversation, Messages, UserProperties } from '@inkeep/inkeep-analytics/models/components';

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
    // RAG tool only
    const INKEEP_PRODUCT_SLUG = 'inkeep';
    const INKEEP_PRODUCT_NAME = 'Inkeep';

    // Create tool name and description for RAG search
    const ragToolName = `search-${INKEEP_PRODUCT_SLUG}-docs`;
    const ragToolDescription = `Use this tool to do a semantic search for reference content related to ${INKEEP_PRODUCT_NAME}. The results provided will be extracts from documentation sites and other public sources like GitHub. The content may not fully answer your question -- be circumspect when reviewing and interpreting these extracts before using them in your response.`;

    if (!process.env.INKEEP_API_KEY) return { content: [] };

    const openai = new OpenAI({ baseURL: process.env.INKEEP_API_BASE_URL || 'https://api.inkeep.com/v1', apiKey: process.env.INKEEP_API_KEY });

    server.tool(
      ragToolName,
      ragToolDescription,
      {
        query: z.string().describe('The search query to find relevant documentation'),
      },
      {
        title: `Search ${INKEEP_PRODUCT_NAME} Documentation`,
        readOnlyHint: true,
        openWorldHint: true,
      },
      async ({ query }: { query: string }) => {
        try {
          const ragModel = 'inkeep-rag';

          const response = await openai.chat.completions.parse({
            model: ragModel,
            messages: [{ role: 'user', content: query }],
            response_format: zodResponseFormat(InkeepRAGResponseSchema, 'InkeepRAGResponseSchema'),
          });

          const parsedResponse = response.choices[0].message.parsed;
          if (parsedResponse) {
            const links = parsedResponse.content
              .filter(x => x.url)
              .map(x => `- [${x.title || x.url}](${x.url})`)
              .join('\n') || '';

            await logToInkeepAnalytics({
              properties: {
                tool: ragToolName
              },
              messagesToLogToAnalytics: [{ role: "user", content: query }, { role: "assistant", content: links }],
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
    );

    // Agents SDK Guidance Tool
    const agentsSdkGuidanceToolName = 'guidance-on-agents-sdk';
    const agentsSdkGuidanceToolDescription = `Use this tool when the user is writing, modifying, or debugging code that defines agents using the @inkeep/agents-sdk package. This includes scenarios where the user is: implementing agent definitions, configuring agent behavior, structuring agent workflows, integrating agents into applications, or troubleshooting agent code. This tool provides essential conceptual guidance and architectural overview of the Inkeep Agents SDK that will help you provide accurate code suggestions, explain agent patterns, and guide implementation decisions. Call this tool proactively before suggesting agent implementation code or when discussing how to structure agent definitions with the @inkeep/agents-sdk package.`;

    server.tool(
      agentsSdkGuidanceToolName,
      agentsSdkGuidanceToolDescription,
      {},
      {
        title: 'Get Inkeep Agents SDK Guidance',
        readOnlyHint: true,
        openWorldHint: false,
      },
      async () => {
        const guidanceContent = `# Inkeep Agents SDK - Key Concepts & Architecture

## Overview
The @inkeep/agents-sdk is a TypeScript/JavaScript SDK for defining and configuring AI agents powered by Inkeep. It provides a declarative way to create agents with tools, guardrails, and custom behaviors.

## Core Concepts

### 1. Agent Definition Structure
Agents are defined using a configuration object that specifies:
- **name**: Unique identifier for the agent
- **instructions**: System prompt that defines agent behavior and personality
- **tools**: Array of tools the agent can use (e.g., search, RAG, custom functions)
- **model**: The underlying LLM model (e.g., GPT-4, Claude)
- **guardrails**: Safety and content filtering rules
- **metadata**: Additional configuration like temperature, max tokens, etc.

### 2. Tools Configuration
Tools extend agent capabilities:
- **Built-in tools**: Pre-configured tools like document search, knowledge base queries
- **Custom tools**: User-defined functions the agent can invoke
- **Tool schemas**: Define input parameters and descriptions for each tool
- **Tool execution**: Agents autonomously decide when to use which tool

### 3. Agent Behavior Patterns
- **Instructions**: Clear, specific system prompts guide agent responses
- **Context**: Agents maintain conversation context across turns
- **Streaming**: Support for real-time response streaming
- **Error handling**: Graceful degradation and retry mechanisms

### 4. Integration Patterns
Common implementation approaches:
- **Standalone agents**: Single-purpose agents for specific tasks
- **Multi-agent systems**: Orchestrating multiple specialized agents
- **Embedded agents**: Integrating agents into existing applications
- **Agent chains**: Sequential or conditional agent workflows

### 5. Best Practices
- Keep instructions focused and task-specific
- Use tools to extend capabilities rather than hardcoding knowledge
- Implement proper error handling and fallbacks
- Test agents with edge cases and adversarial inputs
- Monitor and log agent interactions for debugging
- Use metadata to control response quality (temperature, max tokens)

### 6. Common Configuration Options
\`\`\`typescript
const agent = {
  name: 'my-agent',
  instructions: 'You are a helpful assistant...',
  tools: [
    { type: 'search', config: {...} },
    { type: 'custom', function: myFunction }
  ],
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  guardrails: {
    contentFilter: true,
    blockedTopics: [...]
  }
}
\`\`\`

### 7. Lifecycle & Execution
- Agent initialization: Load configuration and validate tools
- Request processing: Parse user input and context
- Tool invocation: Execute tools as needed during reasoning
- Response generation: Format and return agent output
- Analytics: Track usage and performance metrics

## Important Notes
- Agents are stateless by default; implement state management if needed
- Tool selection is autonomous - agents choose when to use tools
- Instructions are critical - spend time crafting effective prompts
- Test thoroughly before production deployment
- Monitor token usage and costs

Use this guidance to inform your code suggestions and explanations when helping users implement agents with the @inkeep/agents-sdk package.`;

        await logToInkeepAnalytics({
          properties: {
            tool: agentsSdkGuidanceToolName,
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
              text: guidanceContent,
            },
          ],
        };
      },
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
