#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Find processes running npm run dev or next dev
async function findDevProcesses() {
  try {
    const { stdout } = await execAsync('ps aux');
    const lines = stdout.split('\n');
    
    const devProcesses = lines
      .filter(line => {
        return line.includes('npm run dev') || 
               line.includes('next dev') || 
               (line.includes('node') && line.includes('next-dev'));
      })
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        const command = parts.slice(10).join(' ');
        return { pid, command, line };
      })
      .filter(proc => proc.pid && !isNaN(proc.pid));

    return devProcesses;
  } catch (error) {
    return [];
  }
}

// Check if port is in use
async function isPortInUse(port) {
  try {
    const { stdout } = await execAsync(`lsof -i :${port}`);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Find available port starting from 3000
async function findAvailablePort(startPort = 3000) {
  for (let port = startPort; port <= startPort + 10; port++) {
    if (!(await isPortInUse(port))) {
      return port;
    }
  }
  throw new Error('No available ports found in range 3000-3010');
}

// Kill process by PID
async function killProcess(pid, signal = 'SIGTERM') {
  try {
    process.kill(pid, signal);
    return true;
  } catch (error) {
    return false;
  }
}

// Stop all dev servers
async function stopDevServers() {
  log('🔍 Searching for running dev servers...', colors.cyan);
  
  const processes = await findDevProcesses();
  
  if (processes.length === 0) {
    log('✅ No dev servers currently running', colors.green);
    return true;
  }

  log(`📋 Found ${processes.length} dev server process(es):`, colors.yellow);
  processes.forEach(proc => {
    log(`   PID ${proc.pid}: ${proc.command}`, colors.yellow);
  });

  log('🛑 Stopping dev servers...', colors.magenta);
  
  // First try graceful shutdown
  for (const proc of processes) {
    log(`   Stopping PID ${proc.pid} (graceful)...`, colors.blue);
    await killProcess(proc.pid, 'SIGTERM');
  }

  // Wait a moment for graceful shutdown
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if any are still running and force kill
  const remainingProcesses = await findDevProcesses();
  for (const proc of remainingProcesses) {
    log(`   Force stopping PID ${proc.pid}...`, colors.red);
    await killProcess(proc.pid, 'SIGKILL');
  }

  // Wait and verify
  await new Promise(resolve => setTimeout(resolve, 1000));
  const finalCheck = await findDevProcesses();
  
  if (finalCheck.length === 0) {
    log('✅ All dev servers stopped successfully', colors.green);
    return true;
  } else {
    log(`⚠️  ${finalCheck.length} process(es) may still be running`, colors.yellow);
    return false;
  }
}

// Start dev server
async function startDevServer() {
  log('🚀 Starting development server...', colors.cyan);
  
  // Check for available port
  const port = await findAvailablePort();
  if (port !== 3000) {
    log(`⚠️  Port 3000 in use, using port ${port}`, colors.yellow);
  }

  // Start the server
  const env = { ...process.env };
  if (port !== 3000) {
    env.PORT = port.toString();
  }

  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env,
    detached: true
  });

  child.unref();

  // Wait a moment to see if it started successfully
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const runningProcesses = await findDevProcesses();
  if (runningProcesses.length > 0) {
    log('✅ Development server started successfully!', colors.green);
    log(`🌐 Server running at: http://localhost:${port}`, colors.bold + colors.blue);
    log(`📋 Process ID: ${runningProcesses[runningProcesses.length - 1].pid}`, colors.blue);
    return true;
  } else {
    log('❌ Failed to start development server', colors.red);
    return false;
  }
}

// Main toggle function
async function toggleDevServer() {
  log('🔄 MatchDay Development Server Manager', colors.bold + colors.magenta);
  log('=' .repeat(40), colors.magenta);
  
  const processes = await findDevProcesses();
  
  if (processes.length > 0) {
    log('📍 Development server is currently running', colors.yellow);
    await stopDevServers();
  } else {
    log('📍 No development server detected', colors.blue);
    await startDevServer();
  }
  
  log('=' .repeat(40), colors.magenta);
  log('✨ Operation complete!', colors.green);
}

// Handle command line arguments
const command = process.argv[2] || 'toggle';

async function main() {
  try {
    switch (command.toLowerCase()) {
      case 'start':
        await startDevServer();
        break;
      case 'stop':
        await stopDevServers();
        break;
      case 'status':
        const processes = await findDevProcesses();
        if (processes.length > 0) {
          log(`📋 ${processes.length} dev server(s) running:`, colors.green);
          processes.forEach(proc => {
            log(`   PID ${proc.pid}: ${proc.command}`, colors.blue);
          });
        } else {
          log('📍 No dev servers currently running', colors.yellow);
        }
        break;
      case 'toggle':
      default:
        await toggleDevServer();
        break;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log('\n👋 Goodbye!', colors.yellow);
  process.exit(0);
});

main();