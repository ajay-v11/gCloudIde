import express from 'express';
import fs from 'fs';
import yaml from 'yaml';
import path from 'path';
import cors from 'cors';
import {fileURLToPath} from 'url';
import {
  KubeConfig,
  AppsV1Api,
  CoreV1Api,
  NetworkingV1Api,
} from '@kubernetes/client-node';

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kubeconfig = new KubeConfig();
kubeconfig.loadFromDefault();
const coreV1Api = kubeconfig.makeApiClient(CoreV1Api);
const appsV1Api = kubeconfig.makeApiClient(AppsV1Api);
const networkingV1Api = kubeconfig.makeApiClient(NetworkingV1Api);

// Track active sessions
const activeSessions = new Map();

const readAndParseKubeYaml = (filePath: string, replId: string): Array<any> => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return yaml.parseAllDocuments(fileContent).map((doc) => {
    const parsed = doc.toJSON();
    if (parsed.kind === 'ServiceAccount') return parsed;
    const stringified = JSON.stringify(parsed);
    const replaced = stringified.replace(/service_name/g, replId);
    return JSON.parse(replaced);
  });
};

const checkIfResourceExists = async (
  replId: string,
  namespace: string = 'default'
) => {
  try {
    await Promise.all([
      appsV1Api.readNamespacedDeployment(replId, namespace),
      coreV1Api.readNamespacedService(replId, namespace),
      networkingV1Api.readNamespacedIngress(replId, namespace),
    ]);
    return true;
  } catch (error) {
    return false;
  }
};

const deleteResources = async (
  replId: string,
  namespace: string = 'default'
) => {
  const deletePromises = [
    appsV1Api
      .deleteNamespacedDeployment(replId, namespace)
      .catch((err) => (err.statusCode === 404 ? null : Promise.reject(err))),
    coreV1Api
      .deleteNamespacedService(replId, namespace)
      .catch((err) => (err.statusCode === 404 ? null : Promise.reject(err))),
    networkingV1Api
      .deleteNamespacedIngress(replId, namespace)
      .catch((err) => (err.statusCode === 404 ? null : Promise.reject(err))),
  ];

  await Promise.all(deletePromises);
  // Wait for resources to be fully deleted
  await new Promise((resolve) => setTimeout(resolve, 2000));
};

// Periodically check for expired sessions
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
setInterval(() => {
  const now = new Date();
  for (const [replId, session] of activeSessions.entries()) {
    const inactiveDuration = now.getTime() - session.lastActivityTime.getTime();
    if (inactiveDuration > INACTIVITY_TIMEOUT) {
      // Delete resources for expired session
      deleteResources(replId, 'default')
        .then(() => {
          activeSessions.delete(replId);
          console.log(`Deleted resources for expired session: ${replId}`);
        })
        .catch((error) => {
          console.error(`Failed to delete resources for ${replId}:`, error);
        });
    }
  }
}, 60 * 1000); // Check every minute

const createResources = async (manifests: any[], namespace: string) => {
  for (const manifest of manifests) {
    if (manifest.kind === 'ServiceAccount') continue;

    switch (manifest.kind) {
      case 'Deployment':
        await appsV1Api.createNamespacedDeployment(namespace, manifest);
        break;
      case 'Service':
        await coreV1Api.createNamespacedService(namespace, manifest);
        break;
      case 'Ingress':
        await networkingV1Api.createNamespacedIngress(namespace, manifest);
        break;
    }
  }
};

app.post('/start', async (req, res) => {
  const {replId, userId} = req.body;
  const namespace = 'default';

  try {
    // Check if resources exist first
    const exists = await checkIfResourceExists(replId, namespace);
    if (exists) {
      console.log(`Found existing resources for ${replId}, cleaning up...`);
      await deleteResources(replId, namespace);
      // Remove from active sessions if it exists
      activeSessions.delete(replId);
    }

    // Parse and create new resources
    const kubeManifests = readAndParseKubeYaml(
      path.join(__dirname, '../service.yaml'),
      replId
    );

    await createResources(kubeManifests, namespace);

    // Track the new session
    activeSessions.set(replId, {
      userId,
      lastActivityTime: new Date(), // Initialize last activity time
    });

    res.status(200).send({
      message: 'Resources created successfully',
      serviceUrl: `${replId}.cloudide.site`,
    });
  } catch (error) {
    console.error('Failed to manage resources:', error);
    // Attempt cleanup on failure
    try {
      await deleteResources(replId, namespace);
      activeSessions.delete(replId);
    } catch (cleanupError) {
      console.error('Failed to cleanup after error:', cleanupError);
    }
    res.status(500).send({
      message: 'Failed to create resources',
      error: error.message,
      details: error.response?.body?.message || error.response?.statusMessage,
    });
  }
});

app.post('/stop', async (req, res) => {
  const {replId} = req.body;
  const namespace = 'default';

  try {
    // Check if the session exists
    if (!activeSessions.has(replId)) {
      return res.status(404).send({
        message: 'Session not found',
      });
    }

    // Delete the resources
    await deleteResources(replId, namespace);

    // Remove the session from active sessions
    activeSessions.delete(replId);

    res.status(200).send({
      message: 'Resources deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete resources:', error);
    res.status(500).send({
      message: 'Failed to delete resources',
      error: error.message,
      details: error.response?.body?.message || error.response?.statusMessage,
    });
  }
});

app.post('/activity', async (req, res) => {
  const {replId} = req.body;

  try {
    // Update the last activity time for the session
    if (activeSessions.has(replId)) {
      const session = activeSessions.get(replId);
      session.lastActivityTime = new Date();
      activeSessions.set(replId, session);
    }

    res.status(200).send({
      message: 'Activity updated successfully',
    });
  } catch (error) {
    console.error('Failed to update activity:', error);
    res.status(500).send({
      message: 'Failed to update activity',
      error: error.message,
    });
  }
});

app.get('/stats/:replId', async (req, res) => {
  const {replId} = req.params;
  const namespace = 'default';

  try {
    // Fetch deployment status
    const deployment = await appsV1Api.readNamespacedDeployment(
      replId,
      namespace
    );
    const deploymentStatus = deployment.body.status;

    // Fetch pods associated with the deployment
    const pods = await coreV1Api.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      `app=${replId}` // Use the label selector to find pods for this deployment
    );

    const podDetails = await Promise.all(
      pods.body.items.map(async (pod) => {
        const podName = pod.metadata.name;

        // Fetch pod logs
        const logs = await coreV1Api.readNamespacedPodLog(podName, namespace);

        // Fetch pod status
        const podStatus = pod.status;

        return {
          podName,
          logs,
          status: podStatus,
        };
      })
    );

    res.status(200).send({
      deploymentStatus,
      pods: podDetails,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    res.status(500).send({
      message: 'Failed to fetch stats',
      error: error.message,
      details: error.response?.body?.message || error.response?.statusMessage,
    });
  }
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
