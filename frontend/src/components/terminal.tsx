import {useEffect, useRef} from 'react';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {useSearchParams} from 'react-router-dom';
import {socketManager} from '../lib/sockerManger';

const MyTerminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isInitializedRef = useRef(false);

  const [searchParams] = useSearchParams();
  const replId = searchParams.get('replid') ?? '';

  useEffect(() => {
    if (isInitializedRef.current || !terminalRef.current) {
      return;
    }

    isInitializedRef.current = true;
    socketManager.connect(replId);

    // Initialize terminal
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'monospace',
      convertEol: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#e0e0e0',
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Store references
    terminalInstance.current = terminal;
    fitAddonRef.current = fitAddon;

    // Open terminal
    terminal.open(terminalRef.current);

    // Delay the initial fit to ensure proper sizing
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }, 0);

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        setTimeout(() => {
          if (fitAddonRef.current) {
            fitAddonRef.current.fit();
          }
        }, 0);
      }
    };
    window.addEventListener('resize', handleResize);

    // Handle terminal input
    const handleTerminalData = (data: string) => {
      socketManager.emit('terminal:write', data);
    };
    terminal.onData(handleTerminalData);

    // Handle terminal output
    const handleServerData = (data: string) => {
      if (terminalInstance.current) {
        terminalInstance.current.write(data);
      }
    };
    socketManager.subscribe('terminal:data', handleServerData);

    // Handle connection events
    const handleConnect = () => {
      terminal.writeln('\r\n\x1b[32mConnected to terminal server\x1b[0m\r\n');
    };
    socketManager.subscribe('connect', handleConnect);

    const handleDisconnect = () => {
      terminal.writeln(
        '\r\n\x1b[31mDisconnected from terminal server\x1b[0m\r\n'
      );
    };
    socketManager.subscribe('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      socketManager.unsubscribe('connect', handleConnect);
      socketManager.unsubscribe('disconnect', handleDisconnect);
      socketManager.unsubscribe('terminal:data', handleServerData);

      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
      isInitializedRef.current = false;
    };
  }, [replId]);

  return (
    <div
      ref={terminalRef}
      className='h-96 w-full bg-[#1e1e1e] text-[#e0e0e0] rounded-lg overflow-auto p-2'
    />
  );
};

export default MyTerminal;
