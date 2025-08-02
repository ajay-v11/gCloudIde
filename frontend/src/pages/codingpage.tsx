import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import CodeEditor from './code';
import axios from 'axios';
import Loading from '../components/loading';
import {API} from '../lib/config';

export const CodingPage = () => {
  const [isBooting, setIsBooting] = useState(true);

  const [searchParams] = useSearchParams();
  const replId = searchParams.get('replid') ?? '';
  const userId = searchParams.get('userid') ?? '';

  useEffect(() => {
    if (!replId) return;

    const startProject = async () => {
      try {
        // Start the project by making a POST request to the backend
        await axios.post(`${API.ORCHESTRATOR}/start`, {replId, userId});

        // Start polling for status
        const intervalId = setInterval(async () => {
          try {
            const response = await axios.get(
              `${API.ORCHESTRATOR}/stats/${replId}`
            );
            const data = response.data;
            const {deploymentStatus} = data;

            // Check if the deployment is ready
            if (deploymentStatus.readyReplicas > 0) {
              clearInterval(intervalId); // Stop polling
              setIsBooting(false); // Set booting to false
            }
          } catch (error) {
            console.error('Error fetching stats:', error);
          }
        }, 5000); // Poll every 5 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
      } catch (error) {
        console.error('Error starting project:', error);
      }
    };

    startProject();

    // Cleanup function to delete resources when the tab is closed
    const handleTabClose = () => {
      const data = JSON.stringify({replId});
      navigator.sendBeacon(`${API.ORCHESTRATOR}/stop`, data);
      console.log('Sent beacon to delete resources');
    };

    // Attach the event listener for tab close
    window.addEventListener('beforeunload', handleTabClose);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, [replId, userId]);

  useEffect(() => {
    const activityInterval = setInterval(() => {
      axios.post(`${API.ORCHESTRATOR}/activity`, {replId});
    }, 5 * 60 * 1000); // Call every 5 minutes

    return () => clearInterval(activityInterval);
  }, [replId]);

  if (isBooting) {
    return (
      <>
        <Loading />
      </>
    );
  }

  return <CodeEditor />;
};
