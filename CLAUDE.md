# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Overview

This repository contains a GitHub Actions workflow system that automates software development stages using Claude AI. The system implements a state machine pattern with human oversight at each stage.

## Workflow Architecture

### State Machine Pattern
The system operates as a finite state machine with these label-based states:
- `needs:*` - Stage is actively being worked on by @claude-dev-truefrontier  
- `review:*` - Stage complete, awaiting human review (human assigned)
- `error:*` - Stage encountered error, needs human attention (human assigned)

### Stage Flow
1. **Triage** (`triage`) - Issue analysis and scope definition
2. **Specification** (`spec`) - BDD/Gherkin feature specification creation  
3. **Architecture** (`architect`) - Technical design and system architecture
4. **Development** (`develop`) - Code implementation and testing

### Workflow Files
- `orchestrator.yml` - Main workflow controller, interprets human commands and manages state transitions
- `stage-triage.yml` - Analyzes issues and creates actionable task lists
- `stage-spec.yml` - Creates BDD specifications using Gherkin format  
- `stage-architect.yml` - Designs technical architecture for complex features
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