import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {import('child_process').ChildProcessWithoutNullStreams} proc
 * @returns {Promise<string>}
 */
const waitStdout = (proc) => {
  return new Promise((resolve) => {
    proc.stdout.on('data', (data) => {
      resolve(data.toString());
    });
  });
};

/**
 * @param {import('child_process').ChildProcessWithoutNullStreams} proc
 * @returns {Promise<void>}
 */
const waitClose = (proc) => {
  return new Promise((resolve) => {
    proc.on('close', () => {
      resolve();
    });
  });
};

test('shows plugins when flag specified', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', '--show-plugins'],
    { cwd: __dirname },
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toMatch(/Currently available plugins:/);
});

test('accepts svg as input stream', async () => {
  const proc = spawn('node', ['../../bin/svgo', '--no-color', '-'], {
    cwd: __dirname,
  });
  proc.stdin.write('<svg><desc>Created with Love</desc></svg>');
  proc.stdin.end();
  const stdout = await waitStdout(proc);
  expect(stdout).toBe('<svg/>');
});

test('accepts svg as string', async () => {
  const input = '<svg><desc>Created with Love</desc></svg>';
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', '--string', input],
    { cwd: __dirname },
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toBe('<svg/>');
});

test('outputs css datauri when flag specified', async () => {
  const input =
    '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#fff"/></svg>';
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', '--datauri', 'css', '--string', input],
    { cwd: __dirname },
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toBe(
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='white'/%3E%3C/svg%3E`,
  );
});

test('outputs datauri only once when flag specified', async () => {
  const input =
    '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#fff"/></svg>';
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', '--datauri', 'enc', '--string', input],
    { cwd: __dirname },
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toBe(
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E',
  );
});

test('exits with an error on unknown datauri format', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', '--datauri', 'webp', '--string', '<svg/>'],
    { cwd: __dirname },
  );
  const [code, stderr] = await Promise.all([
    new Promise((resolve) => {
      proc.on('close', (code) => {
        resolve(code);
      });
    }),
    new Promise((resolve) => {
      proc.stderr.on('data', (error) => {
        resolve(error.toString());
      });
    }),
  ]);
  expect(code).toBe(1);
  expect(stderr).toBe(
    `error: option '--datauri' must have one of the following values: 'base64', 'enc', 'unenc' or 'css'\n`,
  );
});

test('accepts svg as filename', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', 'single.svg', '-o', 'output/single.svg'],
    { cwd: __dirname },
  );
  await waitClose(proc);
  const output = await fs.readFile(
    path.join(__dirname, 'output/single.svg'),
    'utf-8',
  );
  expect(output).toBe('<svg/>');
});

test('output as stream when "-" is specified', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', 'single.svg', '-o', '-'],
    { cwd: __dirname },
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toBe('<svg/>');
});

test('should exit with 1 code on syntax error', async () => {
  const proc = spawn('node', ['../../bin/svgo', '--no-color', 'invalid.svg'], {
    cwd: __dirname,
  });
  const [code, stderr] = await Promise.all([
    new Promise((resolve) => {
      proc.on('close', (code) => {
        resolve(code);
      });
    }),
    new Promise((resolve) => {
      proc.stderr.on('data', (error) => {
        resolve(error.toString());
      });
    }),
  ]);
  expect(code).toBe(1);
  expect(stderr)
    .toBe(`SvgoParserError: invalid.svg:2:27: Unquoted attribute value

  1 | <svg>
> 2 |   <rect x="0" y="0" width=10" height="20" />
    |                           ^
  3 | </svg>
  4 | 

`);
});
