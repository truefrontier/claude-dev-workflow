#!/bin/bash

# GitHub Claude Workflow - Label Setup Script
# Creates all required labels for the workflow state machine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}GitHub Claude Workflow - Label Setup${NC}"
echo "======================================"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get current repository
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
if [ -z "$REPO" ]; then
    echo -e "${RED}Error: Not in a GitHub repository or repository not found${NC}"
    exit 1
fi

echo -e "${GREEN}Setting up labels for repository: ${REPO}${NC}"
echo ""

# Function to create or update a label
create_label() {
    local name="$1"
    local description="$2"
    local color="$3"
    
    echo -n "Creating label: ${name}... "
    
    if gh label create "$name" --description "$description" --color "$color" 2>/dev/null; then
        echo -e "${GREEN}✓ Created${NC}"
    else
        # Label might already exist, try to update it
        if gh label edit "$name" --description "$description" --color "$color" 2>/dev/null; then
            echo -e "${YELLOW}✓ Updated${NC}"
        else
            echo -e "${RED}✗ Failed${NC}"
        fi
    fi
}

echo -e "${BLUE}Creating 'needs:*' labels (AI working)...${NC}"
create_label "needs:specify" "AI is creating specification for this issue" "5319e7"
create_label "needs:specify-revision" "AI is revising specification based on feedback" "5319e7"
create_label "needs:plan" "AI is creating technical plan and task breakdown for this issue" "f57c00"
create_label "needs:plan-revision" "AI is revising technical plan based on feedback" "f57c00"
create_label "needs:develop" "AI is implementing code for this issue" "2e7d32"
create_label "needs:develop-revision" "AI is revising implementation based on feedback" "2e7d32"

echo ""
echo -e "${BLUE}Creating 'review:*' labels (human review required)...${NC}"
create_label "review:specify" "Specification ready for human review" "ba68c8"
create_label "review:plan" "Technical plan and task breakdown ready for human review" "ffb74d"
create_label "review:develop" "Implementation ready for human review" "a5d6a7"

echo ""
echo -e "${BLUE}Creating 'error:*' labels (needs human intervention)...${NC}"
create_label "error:specify" "Specification stage encountered an error" "d32f2f"
create_label "error:plan" "Planning stage encountered an error" "d32f2f"
create_label "error:develop" "Development stage encountered an error" "d32f2f"

echo ""
echo -e "${GREEN}✅ Label setup complete!${NC}"
echo ""
echo -e "${BLUE}Usage:${NC}"
echo "1. Create an issue describing your feature or bug"
echo "2. Comment: @claude-dev-truefrontier"
echo "3. The workflow will automatically start with 'needs:specify' label"
echo ""
echo -e "${BLUE}Label Colors:${NC}"
echo -e "🔵 needs:* (AI working): Blue shades"
echo -e "🟢 review:* (human review): Green shades"  
echo -e "🔴 error:* (needs help): Red"
echo ""
echo -e "${YELLOW}Note: Only one workflow label should be active per issue at a time${NC}"