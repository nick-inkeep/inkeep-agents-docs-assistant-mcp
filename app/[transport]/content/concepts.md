## Agents

In Inkeep, an **Agent** is the top-level entity an end-user interfaces with via conversational experiences (chat) or trigger programmatically (via API).

Under the hood, an Agent is made up of one or more **Sub Agents** that work together to respond to a user or complete a task.

## Tools
When you send a message to an Agent, it is first received by a **Default Sub Agent** that decides what to do next. 

In a simple Agent, there may be only one Sub Agent with a few tools available to it.

**Tools** are actions that a Sub Agent can take, like looking up information or performing a task on apps and APIs.

In Inkeep, tools can be added to Sub Agents as:
- **MCP Servers**: A common way to connect to external services and APIs. Many SaaS providers provide out-of-the-box MCP Servers, but you can also create your own and register them with their associated **Credentials** on Inkeep for Agents to use.
- **Function Tools**: Custom JavaScript functions that Agents can execute directly without the need for standing up an MCP server. 

Typically, you want a Sub Agent to handle narrow, well-defined tasks. As a general rule of thumb, keep Sub Agents to be using the minimum possible tools they need, at most typically 5-7.

## Sub Agent relationships

When your scenario gets complex, it can be useful to break up your logic into multiple Sub Agents that are specialized in specific parts of your task or workflow. This is often referred to as a "Multi-agent" system. 

A Sub Agent can be configured to:
- **Transfer** control of the chat to another Sub Agent. When a transfer happens, the receiving Sub Agent becomes the primary driver of the thread and can respond to the user directly.
- **Delegate** a subtask for another ('child') Sub Agent to do and wait for its response before proceeding with the next step. A child Sub Agent *cannot* respond directly to a user.

## Sub Agent 'turn'

When it's a Sub Agent's turn, it can choose to:
1. Send an update message to the user
2. Call a tool to collect information or take an action
3. Transfer or delegate to another Sub Agent

An Agent's execution stays in this loop until one of the Sub Agents chooses to respond to the user with a final result.

Sub Agents in Inkeep are designed to respond to the user as a single, cohesive unit by default.

## Agent replies with Structured Data

Sometimes, you want your Agent to reply not in plain text but with specific types of well-defined information, often called 'Structured Outputs' (JSON).

With Inkeep, there are a few ways to do this:
- **Data Components**: Structured Outputs that Sub Agents can output in their messages so they can render rich, interactive UIs (lists, buttons, forms, etc.) or convey structured information.
- **Artifacts**: A Sub Agent can save information from a **tool call result** as an artifact in order to make it available to others. For example, a Sub Agent that did a web search can save the contents of a webpage it looked at as an artifact. Once saved, a Sub Agent can cite or reference artifacts in its response, and other Sub Agents or users can fetch the full artifacts if they'd like.
- **Status Updates**: Real-time progress updates that can be plain text or Structured Outputs that can be used to keep users informed about what the Sub Agent is doing during longer operations.

## Passing context to Sub Agents

Beyond using Tools to fetch information, Sub Agents also receive information via:
- **Headers**: In the API request to an Agent, the calling application can include headers for a Sub Agent. Learn more [here](/typescript-sdk/headers).
- **Context Fetchers**: Can be configured for an Agent so that at the beginning of a conversation, an API call is automatically made to an external service to get information that is then made available to any Sub Agent. For example, your Headers may include a `user-id`, which can be used to auto-fetch information from a CRM about the user for any Sub Agent to use.

Headers and fetched context can then be referenced explicitly as variables in Sub Agent prompts, for example, as `headers.toTemplate('user_id')`.

## Projects

You can organize your related MCP Servers, Credentials, Agents, and more into **Projects**. A Project is generally used to represent a set of related scenarios.

For example, you may create one Project for your support team that has all the MCP servers and Agents related to customer support.

## CLI: Push and pull

The Inkeep CLI bridges your TypeScript SDK project and the Visual Builder.

Run the following from your project (the folder that contains your `inkeep.config.ts`) which has an `index.ts` file that exports a project.

- **Push (code → Builder)**: Sync locally defined agents, Sub Agents, tools, and settings from your SDK project into the Visual Builder.

```bash
inkeep push
```

- **Pull (Builder → code)**: Fetch your project from the Visual Builder back into your SDK project. By default, the CLI will LLM-assist in updating your local TypeScript files to reflect Builder changes.

```bash
inkeep pull
```

Push and pull operate at the project level (not individual agents). Define agents in your project and push/pull the whole project.

## Architecture

The Inkeep Agent framework is composed of several key services and libraries that work together:

- **agents-manage-api**: An API that handles configuration of Agents, Sub Agents, MCP Servers, Credentials, and Projects with a REST API.
- **agents-manage-ui**: Visual Builder web interface for creating and managing Agents. Writes to the `agents-manage-api`.
- **agents-sdk**: TypeScript SDK (`@inkeep/agents-sdk`) for declaratively defining Agents and custom tools in code. Writes to `agents-manage-api`. It works as a declarative representation of agents, similar to e.g. Drizzle ORM.
- **agents-cli**: Includes various handy utilities, including `inkeep push` and `inkeep pull` which sync your TypeScript SDK code with the Visual Builder.
- **agents-run-api**: The Runtime API that exposes Agents as APIs and executes Agent conversations. Keeps conversation state and emits OTEL traces.
- **agents-ui**: A UI component library of chat interfaces for embedding rich, dynamic Agent conversational experiences in web apps.