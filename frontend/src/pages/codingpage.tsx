import axios from 'axios';
import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import CodeEditor from './code';

export const CodingPage = () => {
  const [podCreated, setPodCreated] = useState(true);
  const [searchParams] = useSearchParams();
  const replId = searchParams.get('replid') ?? '';
  const userId = searchParams.get('userid') ?? '';
  console.log('replid from param', replId);

  useEffect(() => {
    if (replId) {
      axios
        .post(`http://localhost:3002/start`, {replId: replId, userId: userId})
        .then(() => setPodCreated(true))
        .catch((err) => console.error(err));
    }
  });

  if (!podCreated) {
    return <>Booting...</>;
  }
  return <CodeEditor />;
};
