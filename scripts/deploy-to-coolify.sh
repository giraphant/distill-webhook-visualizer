#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Building frontend...${NC}"
cd /home/distill-webhook-visualizer/frontend
npm run build

echo -e "${BLUE}📋 Copying build to static directory...${NC}"
cp -r build/* /home/distill-webhook-visualizer/static/

echo -e "${BLUE}📝 Committing changes...${NC}"
cd /home/distill-webhook-visualizer
git add -A

# Check if there are changes to commit
if git diff --staged --quiet; then
  echo -e "${BLUE}ℹ️  No changes to commit${NC}"
else
  git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

  echo -e "${BLUE}⬆️  Pushing to GitHub...${NC}"
  git push

  echo -e "${GREEN}✅ Pushed to GitHub successfully!${NC}"
  echo -e "${BLUE}ℹ️  Coolify will automatically deploy from GitHub webhook${NC}"
fi

echo -e "${GREEN}🎉 Deployment process completed!${NC}"
