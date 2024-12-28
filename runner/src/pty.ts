import * as pty from 'node-pty';

export const createPtyProcess = () => {
  return pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 40,
    rows: 24,
    cwd: '/workspace',
    env: {
      ...process.env,
      TERM: 'xterm-color',
    },
  });
};
