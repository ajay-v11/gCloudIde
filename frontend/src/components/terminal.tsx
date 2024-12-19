import React, {useEffect, useRef} from 'react';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const MyTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#e0e0e0',
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminal.onData((data: string) => {
      socket.emit('terminal:write', data);
    });

    socket.on('terminal:data', (data: string) => {
      console.log('Received terminal data:', data);
      terminal.write(data);
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      terminal.write('Connected to terminal\r\n');
    });

    return () => {
      terminal.dispose();
      socket.off('terminal:data');
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#1e1e1e',
        color: '#e0e0e0',
      }}
    />
  );
};

export default MyTerminal;
