# Publishing to GitHub Packages

This package is configured for GitHub Packages registry. Follow these steps to publish.

## Prerequisites

1. **Personal Access Token (Classic)**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with scopes:
     - `write:packages` (upload packages)
     - `read:packages` (download packages)
     - `delete:packages` (delete packages - optional)

2. **Authenticate with npm**
   ```bash
   npm login --scope=@truefrontier --registry=https://npm.pkg.github.com
   ```
   - Username: Your GitHub username
   - Password: Your personal access token
   - Email: Your email address

   Or configure globally:
   ```bash
   echo "@truefrontier:registry=https://npm.pkg.github.com" >> ~/.npmrc
   echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE" >> ~/.npmrc
   ```

## Publishing Steps

1. **Ensure package is ready**
   ```bash
   npm run validate:workflows  # Validate workflow files
   node test-cli.js           # Test CLI functionality
   ```

2. **Publish to GitHub Packages**
   ```bash
   npm publish
   ```

## Installation for Users

After publishing, users can install with:

```bash
# One-time registry configuration (per machine)
npm config set @truefrontier:registry https://npm.pkg.github.com

# Then install normally
npx @truefrontier/claude-dev-workflow init
```

Or with authentication for private packages:
```bash
# Configure registry and auth
echo "@truefrontier:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE" >> ~/.npmrc

# Install
npx @truefrontier/claude-dev-workflow init
```

## Making Package Public

By default, GitHub Packages are private. To make public:

1. Go to https://github.com/truefrontier/claude-dev-workflow/packages
2. Find the package `claude-dev-workflow`
3. Click "Package settings"
4. Scroll to "Danger Zone" 
5. Click "Change package visibility" → "Public"

## Alternative: Dual Publishing

To publish to both GitHub Packages and npm registry:

1. **Remove publishConfig** from package.json temporarily
2. **Publish to npm**: `npm publish`
3. **Restore publishConfig** 
4. **Publish to GitHub**: `npm publish`

## Version Management

```bash
# Update version
npm version patch|minor|major

# Publish new version
npm publish

# Tag and push
git push --follow-tags
```

## Troubleshooting

- **403 Forbidden**: Check token permissions and package visibility
- **404 Not Found**: Verify repository name matches package name
- **Authentication Failed**: Regenerate personal access token
- **Package Already Exists**: Use `npm version patch` to increment version