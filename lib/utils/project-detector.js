const fs = require('fs-extra');
const path = require('path');

const PROJECT_TYPES = {
  node: {
    files: ['package.json'],
    testCommand: 'npm test',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    lintCommand: 'npm run lint',
    configFiles: ['package.json', 'package-lock.json', 'yarn.lock'],
    framework: null // Will be detected from package.json
  },
  php: {
    files: ['composer.json'],
    testCommand: 'vendor/bin/phpunit',
    buildCommand: 'composer install --optimize-autoloader',
    devCommand: 'php artisan serve', // Laravel default, may vary
    lintCommand: 'vendor/bin/phpcs',
    configFiles: ['composer.json', 'composer.lock'],
    framework: null // Will be detected from composer.json
  },
  python: {
    files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
    testCommand: 'pytest',
    buildCommand: 'pip install -r requirements.txt',
    devCommand: 'python manage.py runserver', // Django default, may vary
    lintCommand: 'flake8',
    configFiles: ['requirements.txt', 'pyproject.toml', 'setup.py'],
    framework: null
  },
  rust: {
    files: ['Cargo.toml'],
    testCommand: 'cargo test',
    buildCommand: 'cargo build',
    devCommand: 'cargo run',
    lintCommand: 'cargo clippy',
    configFiles: ['Cargo.toml', 'Cargo.lock'],
    framework: null
  },
  go: {
    files: ['go.mod'],
    testCommand: 'go test ./...',
    buildCommand: 'go build',
    devCommand: 'go run .',
    lintCommand: 'golint',
    configFiles: ['go.mod', 'go.sum'],
    framework: null
  },
  java: {
    files: ['pom.xml', 'build.gradle'],
    testCommand: 'mvn test',
    buildCommand: 'mvn compile',
    devCommand: 'mvn spring-boot:run',
    lintCommand: 'mvn checkstyle:check',
    configFiles: ['pom.xml', 'build.gradle'],
    framework: null
  },
  dotnet: {
    files: ['*.csproj', '*.sln'],
    testCommand: 'dotnet test',
    buildCommand: 'dotnet build',
    devCommand: 'dotnet run',
    lintCommand: 'dotnet format --verify-no-changes',
    configFiles: ['*.csproj', '*.sln', 'appsettings.json'],
    framework: null
  }
};

async function detectProjectType(projectPath = process.cwd()) {
  const detectedTypes = [];
  
  for (const [type, config] of Object.entries(PROJECT_TYPES)) {
    for (const file of config.files) {
      const filePath = path.join(projectPath, file);
      
      // Handle glob patterns like *.csproj
      if (file.includes('*')) {
        const files = await fs.readdir(projectPath).catch(() => []);
        const pattern = new RegExp(file.replace('*', '.*'));
        if (files.some(f => pattern.test(f))) {
          detectedTypes.push(type);
          break;
        }
      } else {
        if (await fs.pathExists(filePath)) {
          detectedTypes.push(type);
          break;
        }
      }
    }
  }
  
  return detectedTypes;
}

async function getProjectDetails(projectPath = process.cwd()) {
  const types = await detectProjectType(projectPath);
  
  if (types.length === 0) {
    return {
      type: 'unknown',
      name: path.basename(projectPath),
      version: 'unknown',
      framework: 'unknown',
      language: 'unknown',
      config: {
        testCommand: 'echo "No test command detected"',
        buildCommand: 'echo "No build command detected"',
        devCommand: 'echo "No dev command detected"',
        lintCommand: 'echo "No lint command detected"'
      }
    };
  }
  
  // Primary type is the first detected
  const primaryType = types[0];
  const config = PROJECT_TYPES[primaryType];
  
  let projectDetails = {
    type: primaryType,
    name: path.basename(projectPath),
    version: 'unknown',
    framework: 'unknown',
    language: primaryType,
    config: { ...config },
    configFiles: config.configFiles,
    multiType: types.length > 1 ? types : null
  };
  
  // Extract specific details based on project type
  try {
    switch (primaryType) {
      case 'node':
        projectDetails = await enhanceNodeDetails(projectDetails, projectPath);
        break;
      case 'php':
        projectDetails = await enhancePHPDetails(projectDetails, projectPath);
        break;
      case 'python':
        projectDetails = await enhancePythonDetails(projectDetails, projectPath);
        break;
      case 'rust':
        projectDetails = await enhanceRustDetails(projectDetails, projectPath);
        break;
      case 'go':
        projectDetails = await enhanceGoDetails(projectDetails, projectPath);
        break;
      case 'java':
        projectDetails = await enhanceJavaDetails(projectDetails, projectPath);
        break;
      case 'dotnet':
        projectDetails = await enhanceDotNetDetails(projectDetails, projectPath);
        break;
    }
  } catch (error) {
    // Continue with basic details if enhancement fails
    console.warn(`Warning: Could not enhance ${primaryType} project details:`, error.message);
  }
  
  return projectDetails;
}

async function enhanceNodeDetails(details, projectPath) {
  const packagePath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(packagePath)) {
    const pkg = await fs.readJson(packagePath);
    details.name = pkg.name || details.name;
    details.version = pkg.version || details.version;
    
    // Detect framework
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    if (dependencies.react) {
      details.framework = 'React';
      details.config.devCommand = 'npm start';
    } else if (dependencies.vue) {
      details.framework = 'Vue';
      details.config.devCommand = 'npm run serve';
    } else if (dependencies.angular) {
      details.framework = 'Angular';
      details.config.devCommand = 'ng serve';
    } else if (dependencies.next) {
      details.framework = 'Next.js';
      details.config.devCommand = 'npm run dev';
    } else if (dependencies.express) {
      details.framework = 'Express.js';
      details.config.devCommand = 'npm run dev';
    } else if (dependencies.nuxt) {
      details.framework = 'Nuxt.js';
      details.config.devCommand = 'npm run dev';
    }
    
    // Override with actual scripts if they exist
    if (pkg.scripts) {
      if (pkg.scripts.test) details.config.testCommand = 'npm test';
      if (pkg.scripts.build) details.config.buildCommand = 'npm run build';
      if (pkg.scripts.dev) details.config.devCommand = 'npm run dev';
      if (pkg.scripts.start) details.config.devCommand = 'npm start';
      if (pkg.scripts.lint) details.config.lintCommand = 'npm run lint';
    }
  }
  return details;
}

async function enhancePHPDetails(details, projectPath) {
  const composerPath = path.join(projectPath, 'composer.json');
  if (await fs.pathExists(composerPath)) {
    const composer = await fs.readJson(composerPath);
    details.name = composer.name || details.name;
    details.version = composer.version || details.version;
    
    // Detect PHP framework
    const dependencies = { ...composer.require, ...composer['require-dev'] };
    if (dependencies['laravel/framework']) {
      details.framework = 'Laravel';
      details.config.devCommand = 'php artisan serve';
      details.config.testCommand = 'php artisan test';
    } else if (dependencies['symfony/symfony']) {
      details.framework = 'Symfony';
      details.config.devCommand = 'symfony serve';
    } else if (dependencies['cakephp/cakephp']) {
      details.framework = 'CakePHP';
    }
  }
  return details;
}

async function enhancePythonDetails(details, projectPath) {
  // Try pyproject.toml first
  const pyprojectPath = path.join(projectPath, 'pyproject.toml');
  if (await fs.pathExists(pyprojectPath)) {
    try {
      const content = await fs.readFile(pyprojectPath, 'utf8');
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
      if (nameMatch) details.name = nameMatch[1];
      if (versionMatch) details.version = versionMatch[1];
    } catch (error) {
      // Continue with defaults
    }
  }
  
  // Check for Django
  if (await fs.pathExists(path.join(projectPath, 'manage.py'))) {
    details.framework = 'Django';
    details.config.devCommand = 'python manage.py runserver';
    details.config.testCommand = 'python manage.py test';
  } else if (await fs.pathExists(path.join(projectPath, 'app.py'))) {
    details.framework = 'Flask';
    details.config.devCommand = 'python app.py';
  }
  
  return details;
}

async function enhanceRustDetails(details, projectPath) {
  const cargoPath = path.join(projectPath, 'Cargo.toml');
  if (await fs.pathExists(cargoPath)) {
    try {
      const content = await fs.readFile(cargoPath, 'utf8');
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
      if (nameMatch) details.name = nameMatch[1];
      if (versionMatch) details.version = versionMatch[1];
      
      // Check for web frameworks
      if (content.includes('actix-web')) {
        details.framework = 'Actix Web';
      } else if (content.includes('rocket')) {
        details.framework = 'Rocket';
      } else if (content.includes('warp')) {
        details.framework = 'Warp';
      }
    } catch (error) {
      // Continue with defaults
    }
  }
  return details;
}

async function enhanceGoDetails(details, projectPath) {
  const goModPath = path.join(projectPath, 'go.mod');
  if (await fs.pathExists(goModPath)) {
    try {
      const content = await fs.readFile(goModPath, 'utf8');
      const moduleMatch = content.match(/module\s+(.+)/);
      if (moduleMatch) {
        details.name = moduleMatch[1].split('/').pop(); // Get last part of module path
      }
      
      // Check for web frameworks
      if (content.includes('gin-gonic/gin')) {
        details.framework = 'Gin';
      } else if (content.includes('gorilla/mux')) {
        details.framework = 'Gorilla Mux';
      } else if (content.includes('echo')) {
        details.framework = 'Echo';
      }
    } catch (error) {
      // Continue with defaults
    }
  }
  return details;
}

async function enhanceJavaDetails(details, projectPath) {
  const pomPath = path.join(projectPath, 'pom.xml');
  const gradlePath = path.join(projectPath, 'build.gradle');
  
  if (await fs.pathExists(pomPath)) {
    try {
      const content = await fs.readFile(pomPath, 'utf8');
      const artifactMatch = content.match(/<artifactId>([^<]+)<\/artifactId>/);
      const versionMatch = content.match(/<version>([^<]+)<\/version>/);
      if (artifactMatch) details.name = artifactMatch[1];
      if (versionMatch) details.version = versionMatch[1];
      
      if (content.includes('spring-boot')) {
        details.framework = 'Spring Boot';
        details.config.devCommand = 'mvn spring-boot:run';
      }
    } catch (error) {
      // Continue with defaults
    }
  } else if (await fs.pathExists(gradlePath)) {
    details.config.testCommand = 'gradle test';
    details.config.buildCommand = 'gradle build';
    details.framework = 'Gradle';
  }
  
  return details;
}

async function enhanceDotNetDetails(details, projectPath) {
  const files = await fs.readdir(projectPath).catch(() => []);
  const csprojFile = files.find(f => f.endsWith('.csproj'));
  
  if (csprojFile) {
    details.name = csprojFile.replace('.csproj', '');
    try {
      const content = await fs.readFile(path.join(projectPath, csprojFile), 'utf8');
      const versionMatch = content.match(/<Version>([^<]+)<\/Version>/);
      if (versionMatch) details.version = versionMatch[1];
      
      if (content.includes('Microsoft.AspNetCore')) {
        details.framework = 'ASP.NET Core';
      } else if (content.includes('Microsoft.NET.Sdk.Web')) {
        details.framework = 'ASP.NET Core';
      }
    } catch (error) {
      // Continue with defaults
    }
  }
  
  return details;
}

function generateCommands(projectDetails) {
  const { config } = projectDetails;
  
  return {
    development: {
      start: config.devCommand,
      test: config.testCommand,
      build: config.buildCommand,
      lint: config.lintCommand
    },
    ci: {
      install: getInstallCommand(projectDetails.type),
      test: config.testCommand,
      build: config.buildCommand,
      lint: config.lintCommand
    }
  };
}

function getInstallCommand(projectType) {
  const installCommands = {
    node: 'npm install',
    php: 'composer install',
    python: 'pip install -r requirements.txt',
    rust: 'cargo build',
    go: 'go mod download',
    java: 'mvn install',
    dotnet: 'dotnet restore'
  };
  
  return installCommands[projectType] || 'echo "No install command configured"';
}

module.exports = {
  detectProjectType,
  getProjectDetails,
  generateCommands,
  PROJECT_TYPES
};