import {useState} from 'react';

interface FileNode {
  [key: string]: FileNode | null; // Directory with children or a file (null)
}

interface FileTreeNodeProps {
  fileName: string;
  nodes: FileNode | null; // Node can be a directory or a file
  path: string;
  onSelect: (path: string) => void; // Callback with the selected path
}

const FileTreeNode = ({fileName, nodes, onSelect, path}: FileTreeNodeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDir = nodes !== null;

  return (
    <div className='ml-2 my-2'>
      <p
        className={`cursor-pointer ${isDir ? 'font-bold' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isDir) {
            setIsOpen((prev) => !prev);
          } else {
            onSelect(path);
          }
        }}>
        {isDir ? (isOpen ? '📂 ' : '📁 ') : '📄 '}
        {fileName}
      </p>
      {isDir && isOpen && (
        <ul>
          {Object.keys(nodes).length > 0 ? (
            Object.keys(nodes).map((child) => (
              <li key={child}>
                <FileTreeNode
                  fileName={child}
                  nodes={nodes[child]}
                  path={`${path}/${child}`}
                  onSelect={onSelect}
                />
              </li>
            ))
          ) : (
            <p className='ml-4 text-gray-50'>[Empty]</p>
          )}
        </ul>
      )}
    </div>
  );
};

interface FileTreeProps {
  tree: FileNode | null; // Root tree structure
  onSelect: (path: string) => void; // Callback when a file is selected
}

const FileTree = ({tree, onSelect}: FileTreeProps) => (
  <div>
    {tree ? (
      <FileTreeNode fileName='/' nodes={tree} onSelect={onSelect} path='' />
    ) : (
      <p className='text-gray-500'>No files available</p>
    )}
  </div>
);

export default FileTree;
