import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import { createConnection } from 'net';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve the Tauri binary path for the current platform.
// E2E tests run against a debug build so tauri-plugin-webdriver-automation is compiled in.
function getTauriBinaryPath(): string {
  if (process.platform === 'darwin') {
    return join(__dirname, '../../src-tauri/target/debug/bundle/macos/Papercut.app/Contents/MacOS/tauri-app');
  }
  if (process.platform === 'win32') {
    return join(__dirname, '../../src-tauri/target/debug/tauri-app.exe');
  }
  // Linux
  return join(__dirname, '../../src-tauri/target/debug/tauri-app');
}

// Poll until something is listening on the given port (TCP connect succeeds).
function waitForPort(port: number, host = '127.0.0.1', retryIntervalMs = 200): Promise<void> {
  return new Promise((resolve) => {
    const tryConnect = (): void => {
      const sock = createConnection(port, host);
      sock.on('connect', () => { sock.destroy(); resolve(); });
      sock.on('error', () => setTimeout(tryConnect, retryIntervalMs));
    };
    tryConnect();
  });
}

// Keep track of the tauri-driver child process
let tauriDriver: ChildProcess | undefined;
let killedTauriDriver = false;

// Resolve the tauri-driver binary from node_modules
const TAURI_DRIVER_BIN = join(__dirname, '../../node_modules/.bin/tauri-driver');

/**
 * `tauri:options` is a vendor capability not yet declared in @wdio/types.
 * Use an extension interface to satisfy TypeScript without losing type safety
 * on the rest of the config object.
 */
interface TauriCapability {
  browserName: string;
  'tauri:options': { application: string };
}

export const config: WebdriverIO.Config = {
  runner: 'local',

  specs: [join(__dirname, 'tests/**/*.test.ts')],
  exclude: [],
  maxInstances: 1, // Tauri apps are single-instance; never run in parallel

  capabilities: [{ browserName: '', 'tauri:options': { application: getTauriBinaryPath() } } as unknown as TauriCapability & WebdriverIO.Capabilities],

  // Connect to tauri-driver which starts in beforeSession on port 4444
  hostname: '127.0.0.1',
  port: 4444,

  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 60000,
  connectionRetryCount: 3,

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000, // full E2E flows including GS can take 30-60 s
  },

  // Linux headless support: set DISPLAY=:99 when running under Xvfb and no DISPLAY is set.
  before(): void {
    if (process.platform === 'linux' && !process.env.DISPLAY) {
      process.env.DISPLAY = ':99';
    }
  },

  // Start tauri-driver before each WebDriverIO session.
  // @crabnebula/tauri-driver wraps the platform-native WebDriver
  // (WebKitWebDriver on Linux, safaridriver on macOS, msedgedriver on Windows).
  beforeSession: async (): Promise<void> => {
    // Kill any leftover tauri-driver/WebKitWebDriver from a previous run (frees port 4444).
    spawnSync('pkill', ['-f', 'tauri-driver'], { stdio: 'ignore' });
    spawnSync('pkill', ['-f', 'WebKitWebDriver'], { stdio: 'ignore' });
    // Wait for the OS to release port 4444 before binding again.
    await new Promise<void>((r) => setTimeout(r, 500));

    tauriDriver = spawn(TAURI_DRIVER_BIN, ['--port', '4444'], {
      stdio: [null, process.stdout, process.stderr],
      env: {
        ...process.env,
        // Headless CI environments may lack a GPU; disable DMA-BUF to prevent
        // WebKitGTK rendering failures in Xvfb.
        WEBKIT_DISABLE_DMABUF_RENDERER: '1',
      },
    });
    tauriDriver.on('error', (error: Error) => {
      console.error('tauri-driver error:', error);
      process.exit(1);
    });
    tauriDriver.on('exit', (code: number | null) => {
      if (!killedTauriDriver) {
        console.error('tauri-driver exited unexpectedly with code:', code);
        process.exit(1);
      }
    });

    // Wait for tauri-driver to initialize its WebDriver server on port 4444
    await waitForPort(4444);
  },

  // Clean up after each session
  afterSession: (): void => {
    killedTauriDriver = true;
    tauriDriver?.kill();
    killedTauriDriver = false; // reset for next session
  },

  // Final cleanup
  onComplete: (): void => {
    killedTauriDriver = true;
    tauriDriver?.kill();
  },
};
