# Redis

A Model Context Protocol server that provides read-only access to Redis databases. This server enables LLMs to inspect Redis and execute Redis commands.

To learn more about MCP Servers see:
- [What is MCP](https://skeet.build/docs/guides/what-is-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

This Redis MCP Server was designed for seamless integration with [skeet.build](https://skeet.build)

## Components

### Tools

- **query**
  - Execute Redis commands against the connected database
  - Input: `command` (string): The Redis command to execute
  - Supported commands include:
    - Read-only commands (GET, KEYS, SCAN, HGETALL, etc.)
    - SET read operations: SINTER, SUNION, SDIFF, SRANDMEMBER
    - SET write operations: SADD, SREM, SPOP, SMOVE, SINTERSTORE, SUNIONSTORE, SDIFFSTORE

### Resources

The server provides information about Redis keys:

- **Redis Keys** (`redis://<host>/keys`)
  - List of all keys in the Redis database with their types
  
- **Key Schemas** (`redis://<host>/<key>/schema`)
  - JSON schema information for each key
  - Includes key type and type-specific metadata
  - For strings: the value
  - For lists/sets/sorted sets: length, members (for smaller sets)
  - For hashes: fields and values

## Usage with Claude Desktop

To use this server with the Claude Desktop app, add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

### NPX

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": [
        "-y",
        "@skeetbuild/redis",
        "redis://localhost:6379/0"
      ]
    }
  }
}
```

Replace `redis://localhost:6379/0` with your Redis connection string.

## Usage with Cursor

To use this server with [Cursor](https://skeet.build/docs/apps/cursor#what-is-model-context-protocol), add the following configuration to your global (`~/.cursor/mcp.json`) or project-specific (`.cursor/mcp.json`) configuration file:

### Global Configuration

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": [
        "-y",
        "@skeetbuild/redis",
        "redis://localhost:6379/0"
      ]
    }
  }
}
```

For more details on setting up MCP with Cursor, see the [Cursor MCP documentation](https://skeet.build/docs/apps/cursor#what-is-model-context-protocol).

## Usage with GitHub Copilot in VS Code

To use this server with [GitHub Copilot in VS Code](https://skeet.build/docs/apps/github-copilot), add a new MCP server using the VS Code command palette:

1. Press `Cmd+Shift+P` and search for "Add MCP Server"
2. Select "SSE MCP Server" and use the following configuration:

```json
{
  "mcp": {
    "servers": {
      "redis": {
        "command": "npx",
        "args": [
          "-y",
          "@skeetbuild/redis",
          "redis://localhost:6379/0"
        ]
      }
    }
  }
}
```

For detailed setup instructions, see the [GitHub Copilot MCP documentation](https://skeet.build/docs/apps/github-copilot).

## Usage with Windsurf

To use this server with [Windsurf](https://skeet.build/docs/apps/windsurf), add the following configuration to your Windsurf MCP settings:

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": [
        "-y",
        "@skeetbuild/redis",
        "redis://localhost:6379/0"
      ]
    }
  }
}
```

For more information on configuring MCP with Windsurf, refer to the [Windsurf MCP documentation](https://skeet.build/docs/apps/windsurf).

## Acknowledgements

This server is inspired by the PostgreSQL MCP server from the modelcontextprotocol project.

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository. 
