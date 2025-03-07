import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';

interface File {
  type: 'file' | 'dir';
  name: string;
}

export const fetchDir = (dir: string, baseDir: string): Promise<File[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, {withFileTypes: true}, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files.map((file) => ({
            type: file.isDirectory() ? 'dir' : 'file',
            name: file.name,
            // Docker path: `${baseDir}/${file.name}`
            //path: path.join(baseDir, file.name),
            path: path.join(`${baseDir}/${file.name}`),
          }))
        );
      }
    });
  });
};

export const fetchFileContent = (file: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

export const saveFile = async (
  file: string,
  content: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, content, 'utf8', (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

export async function generateFileTree(directory: string) {
  const tree = {};

  async function buildTree(currentDir, currentTree) {
    const files = await fsp.readdir(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = await fsp.stat(filePath);

      if (stat.isDirectory()) {
        currentTree[file] = {};
        await buildTree(filePath, currentTree[file]);
      } else {
        currentTree[file] = null;
      }
    }
  }

  await buildTree(directory, tree);
  return tree;
}

export const getCode = (fileName: string): Promise<string> => {
  // Docker path: `/workspace/${fileName}`
  const filePath = path.resolve(
    // process.cwd(),
    //'workspace',
    `/workspace/${fileName.replace(/^\//, '')}`
  );

  console.log('Resolved filePath:', filePath);
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err.message);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
