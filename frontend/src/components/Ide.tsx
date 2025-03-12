import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';
import FileTree from './filetree';
import Editor from '@monaco-editor/react';
import MyTerminal from './terminal';
import {useEffect, useMemo} from 'react';

const ResizeHandle = () => (
  <PanelResizeHandle className='w-2 transition-colors duration-150 cursor-col-resize flex items-center justify-center'>
    <div className='w-0.5 h-full ' />
  </PanelResizeHandle>
);

const VerticalResizeHandle = () => (
  <PanelResizeHandle className='h-2transition-colors duration-150 cursor-row-resize flex items-center justify-center'>
    <div className='h-0.5 w-full ' />
  </PanelResizeHandle>
);

interface FileNode {
  [key: string]: FileNode | null; // Directory with children or a file (null)
}

interface HtmlPreviewData {
  html: string;
  css: string;
}

interface CloudIDEProps {
  fileTree: FileNode | null;
  handleFileSelect: (path: string) => void;
  handleEditorChange: (value: string | undefined) => void;
  code: string | undefined;
  selectedFile: string | null;
  isRunning: boolean;
  handleRun: () => void;
  isSaved: boolean;
  error?: string | null;
  output: string;
  plotImages: string[];
  htmlPreview: HtmlPreviewData | null;
}

const MyEditor: React.FC<CloudIDEProps> = ({
  fileTree,
  handleFileSelect,
  handleEditorChange,
  code,
  selectedFile,
  isSaved,
  isRunning,
  handleRun,
  error,
  output,
  plotImages,
  htmlPreview,
}) => {
  const extensionMap: Record<string, string> = {
    js: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cs: 'csharp',
    html: 'html',
    php: 'php',
    css: 'css',
    json: 'javascript',
  };

  // Use useMemo to compute the language based on file extension
  const currentLanguage = useMemo(() => {
    if (!selectedFile) return 'plaintext';

    const parts = selectedFile.split('.');
    if (parts.length < 2) return 'plaintext';

    const ext = parts.pop()?.toLowerCase() || '';
    return extensionMap[ext] || 'plaintext';
  }, [selectedFile]);

  // Validate file type on selection
  useEffect(() => {
    if (selectedFile && !currentLanguage) {
      alert('File type not supported');
    }
  }, [selectedFile, currentLanguage]);

  // Create HTML document with embedded CSS for the preview
  const getHtmlPreview = () => {
    if (!htmlPreview) return null;

    const combinedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${htmlPreview.css}</style>
        </head>
        <body>${htmlPreview.html}</body>
      </html>
    `;

    return combinedHtml;
  };

  return (
    <div className='h-screen bg-black'>
      <PanelGroup direction='horizontal' className='p-2'>
        {/* File Tree Panel */}
        <Panel defaultSize={10} minSize={10} maxSize={10}>
          <div className='h-full bg-[#1e1e1e] text-slate-400'>
            <h1 className='font-bold text-lg py-2 pl-3 bg-black'>File tree</h1>
            <FileTree tree={fileTree} onSelect={handleFileSelect} />
          </div>
        </Panel>

        <ResizeHandle />

        {/* Editor Panel */}
        <Panel defaultSize={60} minSize={30}>
          <div className='h-full rounded'>
            <div className='bg-black text-white flex items-center justify-between py-2 px-6'>
              {selectedFile || 'Please select a file'}
              {isSaved ? (
                <span className='text-green-500'>Saved</span>
              ) : (
                <div>
                  <span className='text-red-500'>Unsaved{error}</span>
                  <span className='text-xs text-slate-200 ml-3'>
                    Changes will be save after every 3 seconds
                  </span>
                </div>
              )}
              <button
                className='bg-green-700 w-20 h-8 rounded-lg'
                onClick={handleRun}
                disabled={!selectedFile || isRunning}>
                {isRunning ? 'Running...' : 'Run'}
              </button>
            </div>
            <div className='h-[calc(100%-3rem)] rounded-lg border border-slate-600 text-white'>
              {selectedFile ? (
                <Editor
                  language={currentLanguage}
                  onChange={handleEditorChange}
                  theme='vs-dark'
                  value={code}
                  options={{
                    minimap: {enabled: true},
                    scrollBeyondLastLine: false,
                    fontSize: 16,
                    lineNumbers: 'on',
                    automaticLayout: true,
                  }}
                />
              ) : (
                <div className='flex items-center justify-center h-full'>
                  <h1 className='font-bold text-2xl'>
                    {'<---'}Please select a file to start with
                  </h1>
                </div>
              )}
            </div>
          </div>
        </Panel>

        <ResizeHandle />

        {/* Output and Terminal Panel */}
        <Panel defaultSize={30} minSize={15}>
          <PanelGroup direction='vertical'>
            <Panel>
              <div className='h-full'>
                <h1 className='text-black mb-1'>Output</h1>
                <div className='h-[calc(100%-2rem)] bg-slate-200 rounded-md border border-slate-600 overflow-auto p-2'>
                  {/* HTML preview */}
                  {htmlPreview && (
                    <div className='h-full w-full bg-white rounded overflow-hidden'>
                      <iframe
                        srcDoc={getHtmlPreview()}
                        title='HTML Preview'
                        className='w-full h-full border-none'
                        sandbox='allow-scripts'
                      />
                    </div>
                  )}

                  {/* Text output (show only if no HTML preview) */}
                  {!htmlPreview && output && (
                    <pre className='font-mono text-sm'>{output}</pre>
                  )}

                  {/* Plot images (show only if no HTML preview) */}
                  {!htmlPreview && plotImages.length > 0 && (
                    <div className='mt-2'>
                      {plotImages.map((plotImage, index) => (
                        <img
                          key={index}
                          src={`data:image/png;base64,${plotImage}`}
                          alt={`Plot ${index + 1}`}
                          className='max-w-full my-2'
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <VerticalResizeHandle />

            <Panel>
              <div className='h-full rounded-md border border-slate-600'>
                <MyTerminal />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default MyEditor;
