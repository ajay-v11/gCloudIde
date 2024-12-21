import * as pty from 'node-pty';

export const createPtyProcess = () => {
  return pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 40,
    rows: 24,
    cwd: process.env.INIT_CWD ? `${process.env.INIT_CWD}/user` : process.cwd(),
    env: {
      ...process.env,
      TERM: 'xterm-color',
    },
  });
};
