import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import CodeEditor from './code';
import axios from 'axios';

export const CodingPage = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [status, setStatus] = useState(null);
  const [searchParams] = useSearchParams();
  const replId = searchParams.get('replid') ?? '';
  const userId = searchParams.get('userid') ?? '';

  useEffect(() => {
    if (!replId) return;

    const startProject = async () => {
      try {
        // Start the project by making a POST request to the backend
        await fetch(`http://localhost:3002/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({replId, userId}),
        });

        // Start polling for status
        const intervalId = setInterval(async () => {
          try {
            const response = await fetch(
              `http://localhost:3002/stats/${replId}`
            );
            const data = await response.json();
            const {deploymentStatus, pods} = data;

            // Check if the deployment is ready
            if (deploymentStatus.readyReplicas > 0) {
              clearInterval(intervalId); // Stop polling
              setIsBooting(false); // Set booting to false
              setStatus({deploymentStatus, pods}); // Set the status
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
      navigator.sendBeacon(`http://localhost:3002/stop`, data);
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
      axios.post(`http://localhost:3002/activity`, {replId});
    }, 5 * 60 * 1000); // Call every 5 minutes

    return () => clearInterval(activityInterval);
  }, [replId]);

  if (isBooting) {
    return (
      <>
        <div>Booting...</div>
      </>
    );
  }

  return <CodeEditor status={status} />;
};
