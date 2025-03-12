import * as pty from 'node-pty';
import path from 'path';

export const createPtyProcess = () => {
  //process.cwd(),'workspace'
  const workspacePath = path.resolve('/workspace');

  // Create the pty process with bash
  const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 70,
    rows: 40,
    cwd: workspacePath,
    env: {
      ...process.env,
      TERM: 'xterm-color',
      SHELL: '/bin/bash',
    },
  });

  // Send initial commands to set the prompt and current directory
  ptyProcess.write('PS1="workspace$"\r');
  ptyProcess.write(`cd "${workspacePath}"\r`);

  return ptyProcess;
};
