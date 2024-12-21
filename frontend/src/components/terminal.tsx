import {useEffect, useRef} from 'react';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {socket} from '../lib/socket';

const MyTerminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Guard clause with debug
    if (isInitializedRef.current || !terminalRef.current) {
      console.log('Terminal already initialized or ref not ready');
      return;
    }
    console.log('Initializing terminal...');
    isInitializedRef.current = true;

    // Initialize terminal with debug
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'monospace',
      convertEol: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#e0e0e0',
      },
    });

    console.log('Terminal instance created');

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Store references
    terminalInstance.current = terminal;
    fitAddonRef.current = fitAddon;

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();
    console.log('Terminal opened and fitted');

    // Handle window resize
    const handleResize = () => {
      console.log('Window resized');
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Handle terminal input with debug
    const handleTerminalData = (data: string) => {
      console.log(
        'Sending to server:',
        data.split('').map((c) => c.charCodeAt(0))
      );
      socket.emit('terminal:write', data);
    };
    terminal.onData(handleTerminalData);

    // Handle terminal output with debug
    const handleServerData = (data: string) => {
      console.log(
        'Received from server:',
        data.split('').map((c) => c.charCodeAt(0))
      );
      if (terminalInstance.current) {
        terminalInstance.current.write(data);
      }
    };
    socket.on('terminal:data', handleServerData);

    // Handle connection events with debug
    const handleConnect = () => {
      console.log('Socket connected');
      terminal.writeln('\r\n\x1b[32mConnected to terminal server\x1b[0m\r\n');
    };
    socket.on('connect', handleConnect);

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      terminal.writeln(
        '\r\n\x1b[31mDisconnected from terminal server\x1b[0m\r\n'
      );
    };
    socket.on('disconnect', handleDisconnect);

    // Cleanup with debug
    return () => {
      console.log('Cleaning up terminal...');
      window.removeEventListener('resize', handleResize);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('terminal:data', handleServerData);
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
      isInitializedRef.current = false;
      console.log('Cleanup complete');
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      onClick={() => {
        console.log('Terminal clicked');
        console.log('Terminal instance exists:', !!terminalInstance.current);
        console.log('Socket connected:', socket.connected);
      }}
      className='h-96 w-full bg-[#1e1e1e] text-[#e0e0e0] rounded-lg overflow-hidden p-2'
    />
  );
};

export default MyTerminal;
