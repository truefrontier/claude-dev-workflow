# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Overview

This repository provides an npm package that installs a GitHub Actions workflow system for automating software development using Claude AI. The system implements a state machine pattern with human oversight at each stage.

## Development Commands

```bash
# Testing the CLI locally
node bin/cli.js init --dry-run     # Test installation without making changes
node bin/cli.js validate           # Validate workflow configurations
node bin/cli.js help               # Show comprehensive help

# Publishing updates
npm version patch                  # Increment version
npm publish                        # Publish to GitHub Packages

# Testing workflows
npm run validate:workflows         # Validate all workflow YAML files
npm run setup:labels              # Create GitHub labels (cross-platform)
```

## Package Architecture

### CLI System (`lib/commands/`)
- `init.js` - Main installation wizard that detects project type, copies workflows/agents, sets up GitHub
- `validate.js` - Validates workflow files and GitHub configuration
- `labels.js` - Creates required GitHub labels for workflow state management
- `help.js` - Comprehensive help system with project detection

### Utilities (`lib/utils/`)
- `project-detector.js` - Detects language/framework and generates appropriate commands
- `files.js` - Handles copying workflows, agents, and scripts with branch detection
- `validators.js` - Validates GitHub CLI, repository access, and permissions

### Installed Components
When users run `npx @truefrontier/claude-dev-workflow init`, the following are copied to their repository:
- **Workflows** (`workflows/` → `.github/workflows/`) - GitHub Actions workflow files
- **Agents** (`agents/` → `.claude/agents/`) - Claude Code agent configurations
- **Scripts** (`scripts/` → `scripts/`) - Setup and validation utilities

## Workflow Architecture

### Current Stage Flow (v3)
1. **Specify** (`stage-specify.yml`) - Creates comprehensive specifications using GitHub spec-kit methodology
2. **Plan & Tasks** (`stage-plan.yml`) - Develops technical implementation plans AND detailed task breakdowns
3. **Develop** (`stage-develop.yml`) - Implements code following approved specifications and tasks

### Workflow Files
- `orchestrator.yml` - Main workflow controller, interprets human commands and manages state transitions
- `stage-specify.yml` - Creates specifications with user stories and requirements
- `stage-plan.yml` - Creates technical plans AND detailed task breakdowns in a single comprehensive stage
- `stage-develop.yml` - Implements code with full testing and creates feature branches

## Key Behavioral Patterns

### Critical Assignment Order
When transitioning to `needs:*` states, always:
1. Assign @claude-dev-truefrontier FIRST
2. Then add the `needs:*` label
This prevents race conditions where workflows trigger before assignment.

### Comment Requirements
Every stage workflow MUST post a comment with results. Comments are automatically generated from the Claude response content.

### Stage Transitions
- **From no labels**: Human mentions @claude-dev-truefrontier → `needs:triage`
- **From review states**: Human approval → next `needs:*` stage  
- **From error states**: Human retry → `needs:*-revision`
- **Stop command**: Remove all labels and unassign bot

### Tools and Permissions
Each stage has specific tool allowlists:
- **Triage**: Basic file operations, GitHub issue management
- **Spec**: Adds BDD-Gherkin-Writer agent access
- **Architect**: Adds engineer agent for technical design
- **Develop**: Full development tools including git, composer, npm, file editing

### Branch Management
Development stage automatically creates feature branches with pattern:
`feature/issue-{issue_number}-{description}`

## Integration Points

### GitHub Actions Integration
- Uses `anthropics/claude-code-action@v1` for AI interactions
- Requires `ANTHROPIC_API_KEY` secret
- Uses sticky comments for continuous conversation threading

### Label-Based State Management  
- Only one workflow label active at a time
- Labels trigger specific stage workflows via GitHub Actions
- Human assignment controls workflow execution permissions

### Context Preservation
Workflows maintain context by:
- Reading recent issue comments (10-30 depending on stage)
- Filtering out deleted/empty comments
- Tracking revision vs initial runs
- Preserving human assignee information

## Development Guidelines

### When Modifying Workflows
- Maintain the state machine integrity - only one active workflow label
- Preserve the assignment-before-label pattern for state transitions
- Ensure comment posting is mandatory in each stage
- Test label transitions thoroughly to prevent workflow conflicts

### Adding New Stages
- Follow the pattern: setup context → run Claude → post comment → transition state
- Include revision handling (`needs:{stage}-revision` labels)
- Maintain proper tool allowlists for security
- Preserve human assignee tracking

### Tool Restrictions
- Stage workflows have restricted tool access for security
- Development stage has full access for code implementation
- GitHub API tools are limited to issue management functions