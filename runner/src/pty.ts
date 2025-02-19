import * as pty from 'node-pty';
import path from 'path';

export const createPtyProcess = () => {
  return pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 40,
    rows: 24,
    // cwd: '/workspace',
    cwd: path.resolve(process.cwd(), 'workspace'),
    env: {
      ...process.env,
      TERM: 'xterm-color',
    },
  });
};
