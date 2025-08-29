# Publishing Guide

## Prerequisites

1. **GitHub account**: Must have access to truefrontier organization
2. **Personal Access Token**: Create token with `write:packages` scope
3. **GitHub Packages authentication**: Configure npm for GitHub registry

## Pre-publish Steps

1. **Test the CLI locally**:
   ```bash
   npm install
   node test-cli.js
   ```

2. **Validate package structure**:
   ```bash
   npm pack --dry-run
   ```

3. **Update version** (if needed):
   ```bash
   npm version patch  # or minor/major
   ```

4. **Test installation locally**:
   ```bash
   npm pack
   npm install -g github-claude-workflow-1.0.0.tgz
   github-claude-workflow help
   npm uninstall -g github-claude-workflow
   ```

## Publishing

### 1. Authenticate with GitHub Packages
```bash
# Login to GitHub Packages
npm login --scope=@truefrontier --registry=https://npm.pkg.github.com

# Or configure globally
echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN" >> ~/.npmrc
```

### 2. Publish to GitHub Packages  
```bash
# Package is pre-configured with publishConfig
npm publish
```

### 3. Verify Publication
```bash
# Test installation
npx @truefrontier/claude-dev-workflow@latest help

# Check package page
open https://github.com/truefrontier/claude-dev-workflow/packages
```

## Post-publish Tasks

1. **Update README.md** with correct package name
2. **Tag the release**:
   ```bash
   git tag v1.0.0
   git push --tags
   ```
3. **Create GitHub release** with changelog
4. **Update documentation** links

## Usage After Publishing

Users can then:
```bash
# Configure registry (one-time per machine)
npm config set @truefrontier:registry https://npm.pkg.github.com

# Initialize in any repository  
npx @truefrontier/claude-dev-workflow init

# Or install globally
npm install -g @truefrontier/claude-dev-workflow
claude-dev-workflow init
```

## Version Management

Follow semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

```bash
npm version major|minor|patch
git push --follow-tags
npm publish
```