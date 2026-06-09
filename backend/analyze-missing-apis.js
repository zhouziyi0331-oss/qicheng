#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read frontend API file
const frontendApiPath = '/Users/alwan/code/qicheng/miniapp/src/services/api.ts';
const frontendContent = fs.readFileSync(frontendApiPath, 'utf-8');

// Extract all API endpoints from frontend
const endpoints = new Set();

// Match request('...') patterns
const singleQuoteMatches = frontendContent.matchAll(/request\('([^']+)'/g);
for (const match of singleQuoteMatches) {
  endpoints.add(match[1]);
}

// Match request(`...`) patterns (template literals without variables)
const backtickMatches = frontendContent.matchAll(/request\(`([^`$]+)`/g);
for (const match of backtickMatches) {
  endpoints.add(match[1]);
}

// Match request(`...${...}...`) patterns (with variables - extract pattern)
const templateMatches = frontendContent.matchAll(/request\(`([^`]+)`/g);
for (const match of templateMatches) {
  const endpoint = match[1].replace(/\$\{[^}]+\}/g, ':param');
  endpoints.add(endpoint);
}

// Get all backend route files
const backendRoutesDir = '/Users/alwan/code/qicheng/backend/src/routes';
const backendEndpoints = new Set();

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Extract route definitions
      const routeMatches = content.matchAll(/router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
      for (const match of routeMatches) {
        const method = match[1].toUpperCase();
        const route = match[2];
        backendEndpoints.add(`${method} ${route}`);
      }
    }
  }
}

scanDirectory(backendRoutesDir);

// Categorize endpoints by module
const modules = {
  auth: [],
  tasks: [],
  ability: [],
  mentor: [],
  notifications: [],
  opc: [],
  partnerships: [],
  payments: [],
  escrow: [],
  agreement: [],
  aiEngine: [],
  challenge: [],
  communication: [],
  community: [],
  alliances: [],
  student: [],
  company: [],
  admin: [],
  other: []
};

const sortedEndpoints = Array.from(endpoints).sort();

console.log('='.repeat(80));
console.log('Frontend API Endpoints Analysis');
console.log('='.repeat(80));
console.log(`Total unique endpoints: ${endpoints.size}\n`);

// Categorize
for (const endpoint of sortedEndpoints) {
  if (endpoint.startsWith('/auth') || endpoint.startsWith('/api/v1/auth')) {
    modules.auth.push(endpoint);
  } else if (endpoint.includes('/tasks')) {
    modules.tasks.push(endpoint);
  } else if (endpoint.includes('/ability')) {
    modules.ability.push(endpoint);
  } else if (endpoint.includes('/mentor')) {
    modules.mentor.push(endpoint);
  } else if (endpoint.includes('/notifications')) {
    modules.notifications.push(endpoint);
  } else if (endpoint.includes('/opc')) {
    modules.opc.push(endpoint);
  } else if (endpoint.includes('/partnerships')) {
    modules.partnerships.push(endpoint);
  } else if (endpoint.includes('/payments') || endpoint.includes('/payment')) {
    modules.payments.push(endpoint);
  } else if (endpoint.includes('/escrow')) {
    modules.escrow.push(endpoint);
  } else if (endpoint.includes('/agreement')) {
    modules.agreement.push(endpoint);
  } else if (endpoint.includes('/ai-engine')) {
    modules.aiEngine.push(endpoint);
  } else if (endpoint.includes('/challenge')) {
    modules.challenge.push(endpoint);
  } else if (endpoint.includes('/communication')) {
    modules.communication.push(endpoint);
  } else if (endpoint.includes('/community')) {
    modules.community.push(endpoint);
  } else if (endpoint.includes('/alliances')) {
    modules.alliances.push(endpoint);
  } else if (endpoint.includes('/student')) {
    modules.student.push(endpoint);
  } else if (endpoint.includes('/company')) {
    modules.company.push(endpoint);
  } else if (endpoint.includes('/admin')) {
    modules.admin.push(endpoint);
  } else {
    modules.other.push(endpoint);
  }
}

// Print by module
for (const [moduleName, endpoints] of Object.entries(modules)) {
  if (endpoints.length > 0) {
    console.log(`\n${moduleName.toUpperCase()} (${endpoints.length} endpoints):`);
    console.log('-'.repeat(80));
    endpoints.forEach(ep => console.log(`  ${ep}`));
  }
}

console.log('\n' + '='.repeat(80));
console.log('Summary by Module:');
console.log('='.repeat(80));
for (const [moduleName, endpoints] of Object.entries(modules)) {
  if (endpoints.length > 0) {
    console.log(`${moduleName.padEnd(20)} : ${endpoints.length} endpoints`);
  }
}
