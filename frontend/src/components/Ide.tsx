import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';
import FileTree from './filetree';
import Editor from '@monaco-editor/react';
import MyTerminal from './terminal';

const ResizeHandle = () => (
  <PanelResizeHandle className='w-2 hover:bg-slate-600 transition-colors duration-150 cursor-col-resize flex items-center justify-center'>
    <div className='w-0.5 h-full bg-slate-700' />
  </PanelResizeHandle>
);

const VerticalResizeHandle = () => (
  <PanelResizeHandle className='h-2 hover:bg-slate-600 transition-colors duration-150 cursor-row-resize flex items-center justify-center'>
    <div className='h-0.5 w-full bg-slate-700' />
  </PanelResizeHandle>
);
interface FileNode {
  [key: string]: FileNode | null; // Directory with children or a file (null)
}

interface CloudIDEProps {
  fileTree: FileNode | null;
  handleFileSelect: (path: string) => void;
  handleEditorChange: (value: string | undefined) => void;
  code: string | undefined;
  selectedFile: string | null;
  isSaved: boolean;
  error?: string | null;
}

const MyEditor: React.FC<CloudIDEProps> = ({
  fileTree,
  handleFileSelect,
  handleEditorChange,
  code,
  selectedFile,
  isSaved,
  error,
}) => {
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
                <span className='text-red-500'>Unsaved{error}</span>
              )}
              <button className='bg-green-700 w-20 h-8 rounded-lg'>Run</button>
            </div>
            <div className='h-[calc(100%-3rem)] rounded-lg border border-slate-600 text-white'>
              {selectedFile ? (
                <Editor
                  defaultLanguage='javascript'
                  defaultValue='// your changes will be automatically save after 3 seconds'
                  onChange={handleEditorChange}
                  theme='vs-dark'
                  value={code}
                  options={{
                    minimap: {enabled: true},
                    scrollBeyondLastLine: false,
                    fontSize: 14,
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
                <h1 className='text-white mb-1'>Output</h1>
                <div className='h-[calc(100%-2rem)] bg-slate-200 rounded-md border border-slate-600'>
                  <iframe
                    width='100%'
                    height='100%'
                    src={`/java-vertical.svg`}
                  />
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
