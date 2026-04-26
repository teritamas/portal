import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { renderProjectGenerativeUIHtml } from './appHtml.js';
import { searchProjects } from './projectSearch.js';

const APP_RESOURCE_URI = 'ui://teritamas/projects.html';
const PORT = Number.parseInt(process.env.PORT ?? '8787', 10);
const HOST = process.env.HOST ?? '127.0.0.1';

const searchProjectsInputSchema = {
  query: z
    .string()
    .trim()
    .optional()
    .describe(
      'Optional keyword to search project names, descriptions, awards, and tags.'
    ),
  tag: z
    .string()
    .trim()
    .optional()
    .describe('Optional exact project tag filter.'),
  year: z
    .string()
    .trim()
    .optional()
    .describe('Optional exact release year filter.'),
  view: z
    .enum(['auto', 'cards', 'table', 'comparison', 'spotlight'])
    .optional()
    .describe(
      'Optional UI layout preference for the generated project interface.'
    ),
};

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'teritamas-portal',
    version: '0.1.0',
  });

  registerAppResource(
    server,
    'Teritamas Projects Generative UI',
    APP_RESOURCE_URI,
    {
      description:
        'Generative UI for the Teritamas hackathon portfolio, provided as an MCP App.',
    },
    async () => ({
      contents: [
        {
          uri: APP_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: renderProjectGenerativeUIHtml(),
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                resourceDomains: [
                  'https://github.com',
                  'https://raw.githubusercontent.com',
                ],
                connectDomains: [],
              },
            },
          },
        },
      ],
    })
  );

  registerAppTool(
    server,
    'projects.showcase',
    {
      title: 'Showcase projects (Generative UI)',
      description:
        'Display the Teritamas hackathon portfolio using a rich, interactive Generative UI.',
      inputSchema: searchProjectsInputSchema,
      annotations: {
        readOnlyHint: true,
      },
      _meta: {
        ui: {
          resourceUri: APP_RESOURCE_URI,
          visibility: ['app', 'model'],
        },
      },
    },
    async (input) => {
      const result = searchProjects(input);
      const names = result.projects.map((project) => project.name).join(', ');
      const text =
        result.totalCount === 0
          ? 'No matching Teritamas projects were found.'
          : `Found ${result.totalCount} Teritamas projects: ${names}`;

      return {
        content: [{ type: 'text', text }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    }
  );

  registerAppTool(
    server,
    'projects.generate_ui',
    {
      title: 'Configure Generative UI',
      description:
        'Customize the Generative UI layout and content for the Teritamas project showcase.',
      inputSchema: searchProjectsInputSchema,
      annotations: {
        readOnlyHint: true,
      },
      _meta: {
        ui: {
          resourceUri: APP_RESOURCE_URI,
          visibility: ['app', 'model'],
        },
      },
    },
    async (input) => {
      const result = searchProjects(input);
      const layout = result.generatedUi.layout;
      const text =
        result.totalCount === 0
          ? 'Generated an empty project UI because no matching projects were found.'
          : `Generated a ${layout} UI for ${result.totalCount} Teritamas projects.`;

      return {
        content: [{ type: 'text', text }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    }
  );

  return server;
}

const httpServer = createServer(async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method !== 'POST') {
    response.writeHead(405, { allow: 'POST', 'content-type': 'text/plain' });
    response.end('Method Not Allowed');
    return;
  }

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  response.on('close', () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(request, response);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      response.writeHead(500, { 'content-type': 'application/json' });
    }
    response.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

httpServer.listen(PORT, HOST, () => {
  console.error(`Teritamas MCP app server listening on http://${HOST}:${PORT}`);
});
