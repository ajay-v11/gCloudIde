import {useEffect, useState} from 'react';

import {socket} from '../lib/socket';

import MyEditor from '../components/Ide';

interface FileNode {
  [key: string]: FileNode | null; // Directory with children or a file (null)
}

const CodeEditor = () => {
  const [code, setCode] = useState<string | undefined>();
  const [fileTree, setFileTree] = useState<FileNode | null>(null); // Set to null initially
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEditorChange(value: string | undefined) {
    if (!value) return;
    console.log('Current model value:', value);
    setCode(value);
    setIsSaved(false);
  }

  useEffect(() => {
    if (code) {
      const timer = setTimeout(() => {
        socket.emit('file:change', {
          selectedFileName: selectedFile,
          content: code,
        });
        setIsSaved(true);
      }, 3 * 1000);

      // Send updated code after a 3-second delay
      return () => {
        clearTimeout(timer); // Clean up the timer on unmount or code change
      };
    }
  }, [code, selectedFile]);

  // To set the file tree and its contents
  function setFiles(data: FileNode | null) {
    setFileTree(data);
  }

  function setFilesFinal() {
    socket.on('file:tree', setFiles);
  }

  useEffect(setFilesFinal, []);

  // To update file tree when you add new folders or delete files
  function updateFileTree(data: FileNode | null) {
    setFileTree(data);
  }

  // Listen for file:refresh updates
  useEffect(() => {
    const handleFileRefresh = (updatedFileTree: FileNode) => {
      console.log('File tree refreshed:', updatedFileTree);
      updateFileTree(updatedFileTree);
    };

    socket.on('file:refresh', handleFileRefresh);
    console.log('fieltree on refresh', fileTree);

    // Cleanup listener on component unmount
    return () => {
      socket.off('file:refresh', handleFileRefresh);
    };
  }, [socket]);

  //code updation

  // Function to handle file selection
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    socket.emit('file:selected', fileName); // Notify server about the selected file
  };

  useEffect(() => {
    // Listen for the "code" event from the server
    const handleCode = (receivedCode: string) => {
      setSelectedFileContent(receivedCode);
      setError(null); // Clear any previous error
    };

    // Listen for errors
    const handleError = (err: {message: string}) => {
      setError(err.message);
    };

    socket.on('code', handleCode);
    socket.on('error', handleError);

    // Cleanup listeners on component unmount
    return () => {
      socket.off('code', handleCode);
      socket.off('error', handleError);
    };
  }, [selectedFile]);

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
