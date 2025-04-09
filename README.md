# Redis

A Model Context Protocol server that provides read-only access to Redis databases. This server enables LLMs to inspect Redis keys and execute read-only commands.

This server is inspired by the PostgreSQL MCP server from the modelcontextprotocol project.

## Components

### Tools

- **query**
  - Execute read-only Redis commands against the connected database
  - Input: `command` (string): The Redis command to execute
  - Only read-only commands are permitted (GET, KEYS, SCAN, HGETALL, etc.)

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

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository. 