import {useEffect, useState} from 'react';
import MyTerminal from '../components/terminal';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const CodeEditor = () => {
  const [code, setCode] = useState('');

  function handleEditorChange(value: string) {
    console.log('here is the current model value:', value);
    setCode(value);
  }

  useEffect(() => {
    if (code) {
      const timer = setTimeout(() => {
        socket.emit('file:change', {
          content: code,
        });
      }, 5 * 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [code]);

  return (
    <div>
      <div className='grid grid-cols-12 h-screen p-2 px-10 bg-black gap-2'>
        <div className=' col-span-7 pl-10 rounded'>
          <div className='bg-black text-white flex items-center justify-between py-2 px-6'>
            Files-index.js
            <button className='bg-green-700 w-20 h-8 rounded-lg'>Run</button>
          </div>
          <div className=' h-[94vh]'>
            <Editor
              defaultLanguage='javascript'
              defaultValue='// some comment'
              onChange={handleEditorChange}
              theme='vs-dark'
              line={2}
              value={code}
            />
          </div>
        </div>
        <div className='col-span-5 flex flex-col pt-1 gap-1'>
          <h1 className=' text-white'>Output</h1>

          <div className='basis-1/2 bg-slate-200 text-white rounded-md'>
            {code}
            {/*<iframe
              width={'100%'}
              height={'100%'}
              src={`/public/java-vertical.svg`}
            />  */}
          </div>
          <div className='basis-1/2 rounded-md'>
            <h1 className='text-white'>Terminal</h1>
            <MyTerminal />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
//<div class="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
