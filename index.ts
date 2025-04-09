#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "redis";

const server = new Server(
  {
    name: "example-servers/redis",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a Redis URL as a command-line argument");
  process.exit(1);
}

const redisUrl = args[0];

// Parse Redis URL to get host, port, and database information
let redisConfig: { url: string; hostname: string; port: number; db: number } = {
  url: redisUrl,
  hostname: "localhost",
  port: 6379,
  db: 0,
};

try {
  const url = new URL(redisUrl);
  redisConfig.hostname = url.hostname || "localhost";
  redisConfig.port = parseInt(url.port || "6379", 10);
  redisConfig.db = url.pathname ? parseInt(url.pathname.substring(1), 10) || 0 : 0;
} catch (error) {
  console.error(
    "Invalid Redis URL format. Please use: redis://[[username][:password]@][hostname][:port][/db-number]"
  );
  process.exit(1);
}

const resourceBaseUrl = new URL(redisUrl);
resourceBaseUrl.protocol = "redis:";
resourceBaseUrl.password = "";

const redisClient = createClient({ url: redisUrl });

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error("Redis connection error:", err);
  process.exit(1);
});

const SCHEMA_PATH = "schema";
const KEYS_PATH = "keys";

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  await redisClient.connect().catch(() => {});
  
  // Get all keys with their types for resource listing
  const keys = await redisClient.keys("*");
  const resources = [];
  
  for (const key of keys) {
    const type = await redisClient.type(key);
    resources.push({
      uri: new URL(`${key}/${SCHEMA_PATH}`, resourceBaseUrl).href,
      mimeType: "application/json",
      name: `"${key}" (${type}) schema`,
    });
  }
  
  // Add special resource for key listing
  resources.push({
    uri: new URL(KEYS_PATH, resourceBaseUrl).href,
    mimeType: "application/json",
    name: "Redis Keys",
  });
  
  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  await redisClient.connect().catch(() => {});
  
  const resourceUrl = new URL(request.params.uri);
  const pathComponents = resourceUrl.pathname.split("/");
  
  // Handle special key listing resource
  if (pathComponents[pathComponents.length - 1] === KEYS_PATH) {
    const keys = await redisClient.keys("*");
    const keysWithTypes = await Promise.all(
      keys.map(async (key) => {
        const type = await redisClient.type(key);
        return { key, type };
      })
    );
    
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(keysWithTypes, null, 2),
        },
      ],
    };
  }
  
  const schema = pathComponents.pop();
  const keyName = pathComponents.pop();
  
  if (schema !== SCHEMA_PATH) {
    throw new Error("Invalid resource URI");
  }
  
  const type = await redisClient.type(keyName!);
  let schemaData: any = { key: keyName, type };
  
  // Get type-specific information
  switch (type) {
    case "string":
      schemaData.value = await redisClient.get(keyName!);
      break;
    case "list":
      schemaData.length = await redisClient.lLen(keyName!);
      break;
    case "set":
      schemaData.members = await redisClient.sMembers(keyName!);
      break;
    case "hash":
      schemaData.fields = await redisClient.hGetAll(keyName!);
      break;
    case "zset":
      schemaData.length = await redisClient.zCard(keyName!);
      break;
  }
  
  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(schemaData, null, 2),
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description: "Execute Redis commands (read-only)",
        inputSchema: {
          type: "object",
          properties: {
            command: { type: "string" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await redisClient.connect().catch(() => {});
  
  if (request.params.name === "query") {
    const commandStr = request.params.arguments?.command as string;
    
    if (!commandStr) {
      throw new Error("Command parameter is required");
    }
    
    // Parse the command string into an array of arguments
    const commandParts = commandStr.split(/\s+/);
    const command = commandParts[0].toUpperCase();
    
    // Restrict to read-only commands
    const readOnlyCommands = [
      "GET", "MGET", "STRLEN", "HGET", "HGETALL", "HMGET", "HLEN", "HKEYS", "HVALS",
      "LLEN", "LRANGE", "LINDEX", "SISMEMBER", "SMEMBERS", "SCARD", "ZRANGE", "ZRANGEBYSCORE",
      "ZCARD", "ZSCORE", "ZCOUNT", "KEYS", "TYPE", "TTL", "EXISTS", "INFO", "SCAN"
    ];
    
    if (!readOnlyCommands.includes(command)) {
      throw new Error(`Command "${command}" is not allowed. Only read-only commands are permitted.`);
    }
    
    try {
      // Execute the command using sendCommand for flexibility
      const result = await redisClient.sendCommand(commandParts);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: false,
      };
    } catch (error) {
      throw error;
    }
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down Redis client...");
  await redisClient.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down Redis client...");
  await redisClient.quit();
  process.exit(0);
});

runServer().catch(console.error); 