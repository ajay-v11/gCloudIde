import {useEffect, useState} from 'react';
import MyTerminal from '../components/terminal';
import Editor from '@monaco-editor/react';
import FileTree from '../components/filetree';
import {socket} from '../lib/socket';

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
    socket.on('file:refresh', updateFileTree);

    // Cleanup listener on component unmount
    return () => {
      socket.off('file:refresh', updateFileTree);
    };
  });

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
    <div>
      <div className='grid grid-cols-12 p-2 px-1 bg-black gap-2'>
        <div className='col-span-1 bg-[#1e1e1e] text-slate-400'>
          <h1 className='font-bold text-lg py-2 pl-3 bg-black '>File tree</h1>
          <FileTree tree={fileTree} onSelect={handleFileSelect} />
        </div>
        <div className='col-span-7 rounded'>
          <div className='bg-black text-white flex items-center justify-between py-2 px-6'>
            {selectedFile || 'Please select a file'}
            {isSaved ? (
              <span className='text-green-500'>Saved</span>
            ) : (
              <span className='text-red-500'>Unsaved{error}</span>
            )}
            <button className='bg-green-700 w-20 h-8 rounded-lg'>Run</button>
          </div>
          <div className='h-[92vh] rounded-lg border border-slate-600 text-white flex justify-center '>
            {selectedFile ? (
              <Editor
                defaultLanguage='javascript'
                defaultValue='// your changes will be automatically save after 3 seconds'
                onChange={handleEditorChange}
                theme='vs-dark'
                value={code}
              />
            ) : (
              <div className=' h-96 w-96 text-gray-50 text-center'>
                <h1 className='pt-28 font-bold text-2xl'>
                  {'<---'}Please select a file to start with
                </h1>
              </div>
            )}
          </div>
        </div>
        <div className='col-span-4 flex flex-col pt-1 gap-1 h-[94vh]'>
          <h1 className='text-white'>Output</h1>
          <div className='basis-1/2 bg-slate-200 text-white rounded-md border border-slate-600'>
            <iframe
              width={'100%'}
              height={'100%'}
              src={`/public/java-vertical.svg`}
            />
          </div>
          <div className='basis-1/2 rounded-md border border-slate-600'>
            <MyTerminal />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
