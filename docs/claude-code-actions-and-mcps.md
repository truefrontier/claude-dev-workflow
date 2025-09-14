# How Claude Code Action Uses GitHub MCPs

The action includes 5 built-in MCP servers that are automatically configured based
on context:

1. github_comment (github-comment-server.ts)

- Tool: mcp__github_comment__update_claude_comment
- Updates Claude's tracking comment with progress and results
- Automatically included in tag mode

2. github_inline_comment (github-inline-comment-server.ts)

- Tool: mcp__github_inline_comment__create_inline_comment
- Creates inline PR comments on specific lines/files
- Only included for PRs when explicitly allowed via allowedTools

3. github_ci (github-actions-server.ts)

- Tools:
  - mcp__github_ci__get_ci_status - Get CI status summary
  - mcp__github_ci__get_workflow_run_details - Get job/step details
  - mcp__github_ci__download_job_log - Download and analyze logs
- Requires actions: read permission
- Only included for PRs when workflow token is available

4. github_file_ops (github-file-ops-server.ts)

- Tools: File operations with commit signing support
- Only included when use_commit_signing: true

5. github (External Docker container)

- The official GitHub MCP server from ghcr.io/github/github-mcp-server
- Provides comprehensive GitHub API access
- Only included when explicitly allowed via allowedTools starting with
mcp__github__

How to Configure Additional MCPs

You can add any MCP server using the claude_args input with --mcp-config:

Method 1: Inline JSON Configuration

- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_args: |
      --mcp-config '{"mcpServers": {
        "my-server": {
          "command": "npx",
          "args": ["-y", "@example/mcp-server"],
          "env": {
            "API_KEY": "${{ secrets.MY_API_KEY }}"
          }
        }
      }}'
      --allowedTools mcp__my-server__tool_name

Method 2: Configuration File

- name: Create MCP Config
  run: |
    cat > /tmp/mcp-config.json << 'EOF'
    {
      "mcpServers": {
        "custom-server": {
          "command": "npx",
          "args": ["-y", "@your-org/mcp-server"],
          "env": {
            "API_KEY": "${{ secrets.API_KEY }}"
          }
        }
      }
    }
    EOF

- uses: anthropics/claude-code-action@v1
  with:
    claude_args: |
      --mcp-config /tmp/mcp-config.json
      --allowedTools mcp__custom-server__*

Method 3: Multiple MCP Servers

claude_args: |
  --mcp-config /tmp/config1.json
  --mcp-config /tmp/config2.json
  --mcp-config '{"mcpServers": {"inline": {"command": "npx", "args": ["server"]}}}'

Key Points

1. Tool Naming Convention: MCP tools follow the pattern
mcp__{server_name}__{tool_name}
2. Automatic vs Manual Inclusion:
  - Some servers (like github_comment) are automatically included based on mode
  - Others require explicit allowedTools configuration
3. Server Merging: Custom MCP configs merge with built-in servers (custom servers
override built-in ones with same name)
4. Environment Variables: The action passes GitHub context (token, repo, PR number)
  to built-in servers via environment variables
5. Conditional Loading: Built-in servers are conditionally loaded based on:
  - Execution mode (tag vs agent)
  - GitHub context (PR vs issue)
  - Permissions available
  - Tools explicitly allowed

The architecture in src/mcp/install-mcp-server.ts:51-222 shows exactly how the
action decides which servers to include and how it configures them with the
appropriate GitHub context.