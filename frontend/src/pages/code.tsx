import {useEffect, useState} from 'react';

import MyEditor from '../components/Ide';
import {useSearchParams} from 'react-router-dom';

import {socketManager} from '../lib/sockerManger';

interface FileNode {
  [key: string]: FileNode | null; // Directory with children or a file (null)
}

interface FileChangePayLoad {
  selectedFileName: string;
  content: string;
}

const CODE_AUTO_SAVE_DELAY = 3000; //3seconds

const CodeEditor = () => {
  const [code, setCode] = useState<string | undefined>();
  const [fileTree, setFileTree] = useState<FileNode | null>(null); // Set to null initially
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const replId = searchParams.get('replid') ?? '';
  console.log('replid from the code', replId);

  //const socket = createSocketConnection(replId);

  useEffect(() => {
    // Connect if not already connected
    const socket = socketManager.connect('replId');
    //setup event handlers
    const eventHandlers = {
      'file:tree': (data: FileNode | null) => setFileTree(data),
      'file:refresh': (updatedFileTree: FileNode) => {
        console.log('file tree refreshed', updatedFileTree);
        setFileTree(updatedFileTree);
      },
      code: (receivedCode: string) => {
        setCode(receivedCode);
        setError(null);
      },
      error: (err: {message: string}) => setError(err.message),
    };

    //Subscribe to all events
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socketManager.subscribe(event, handler);
    });

    //cleanup
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socketManager.unsubscribe(event, handler);
      });
    };
  }, [replId]);

  //handle editor content changes

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setCode(value);
    setIsSaved(false);
  };

  // Handle file selection
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    socketManager.emit('file:selected', fileName);
  };

  // Auto-save functionality
  useEffect(() => {
    if (!code || !selectedFile) return;

    const timer = setTimeout(() => {
      const payload: FileChangePayLoad = {
        selectedFileName: selectedFile,
        content: code,
      };
      socketManager.emit('file:change', payload);
      setIsSaved(true);
    }, CODE_AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [code, selectedFile]);

  // Update code when selected file content changes
  useEffect(() => {
    if (selectedFile && selectedFileContent) {
      setCode(selectedFileContent);
    }
  }, [selectedFile, selectedFileContent]);

  return (
    <MyEditor
      fileTree={fileTree}
      handleEditorChange={handleEditorChange}
      handleFileSelect={handleFileSelect}
      code={code}
      selectedFile={selectedFile}
      isSaved={isSaved}
      error={error}
    />
  );
};

export default CodeEditor;
