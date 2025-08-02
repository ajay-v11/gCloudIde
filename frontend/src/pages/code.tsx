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

interface HtmlPreviewData {
  html: string;
  css: string;
}

const CODE_AUTO_SAVE_DELAY = 3000; // 3 seconds

const CodeEditor = () => {
  const [code, setCode] = useState<string | undefined>();
  const [fileTree, setFileTree] = useState<FileNode | null>(null); // Set to null initially
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedFileContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false); // Track if the code is running
  const [searchParams] = useSearchParams();
  const replId = searchParams.get('replid') ?? '';

  const [output, setOutput] = useState<string>('');
  const [plotImages, setPlotImages] = useState<string[]>([]);
  const [htmlPreview, setHtmlPreview] = useState<HtmlPreviewData | null>(null);

  console.log('replid from the code', replId);

  useEffect(() => {
    // Setup event handlers
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
      'terminalOutput:data': (receivedOutput: string) => {
        console.log('Received terminal output:', receivedOutput); // Log received output
        setOutput((prevOutput) => prevOutput + receivedOutput);
      },
      error: (err: {message: string}) => setError(err.message),
      'terminal:data': (data: string) => {
        // Handle terminal output (e.g., display it in a terminal component)
        console.log('Terminal output:', data);
      },
      'plot:image': (plotImage: string) => {
        setPlotImages((prev) => [...prev, plotImage]);
      },
      'html:preview': (data: HtmlPreviewData) => {
        console.log('Received HTML preview:', data);
        setHtmlPreview(data);
        // Clear other outputs when showing HTML preview
        setOutput('HTML preview loaded.');
        setPlotImages([]);
      },
    };

    // Subscribe to all events
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socketManager.subscribe(event, handler);
    });

    // Cleanup
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socketManager.unsubscribe(event, handler);
      });
    };
  }, [replId]);

  // Handle editor content changes
  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setCode(value);
    setIsSaved(false);
  };

  // Handle file selection
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    // Clear HTML preview when selecting a new file
    setHtmlPreview(null);
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

  // Handle the "Run" button click
  const handleRun = () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    setIsRunning(true);
    setError(null);

    // Clear previous output, plots, and HTML preview when running new code
    setOutput('');
    setPlotImages([]);
    setHtmlPreview(null);

    // Emit the "file:run" event to the backend
    socketManager.emit('file:run', selectedFile);

    // Reset the running state after a delay (optional)
    setTimeout(() => setIsRunning(false), 5000); // Adjust the delay as needed
  };
  useEffect(() => {
    socketManager.emit('init', replId);
  }, []);

  return (
    <>
      <MyEditor
        fileTree={fileTree}
        handleEditorChange={handleEditorChange}
        handleFileSelect={handleFileSelect}
        code={code}
        selectedFile={selectedFile}
        isSaved={isSaved}
        error={error}
        handleRun={handleRun}
        isRunning={isRunning}
        output={output}
        plotImages={plotImages}
        htmlPreview={htmlPreview}
      />
    </>
  );
};

export default CodeEditor;
