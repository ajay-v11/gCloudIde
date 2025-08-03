import express from 'express';
import fs from 'fs';
import yaml from 'yaml';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import logger from './logger.js';
import { KubeConfig, AppsV1Api, CoreV1Api, NetworkingV1Api, } from '@kubernetes/client-node';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { GoogleAuth } from 'google-auth-library';
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- KUBERNETES CONFIGURATION ---
const kubeconfig = new KubeConfig();
const secretClient = new SecretManagerServiceClient();
let coreV1Api;
let appsV1Api;
let networkingV1Api;
// Add this near the top with other imports
const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
// Store cluster info globally so we can reuse it
let clusterEndpoint = '';
let clusterCert = '';
async function getClusterInfo() {
    if (!clusterEndpoint || !clusterCert) {
        const projectId = 'cloud-ide-467613';
        const [endpointVersion] = await secretClient.accessSecretVersion({
            name: `projects/${projectId}/secrets/gke-public-endpoint/versions/latest`,
        });
        clusterEndpoint = endpointVersion.payload.data.toString();
        const [certVersion] = await secretClient.accessSecretVersion({
            name: `projects/${projectId}/secrets/gke-ca-certificate/versions/latest`,
        });
        clusterCert = certVersion.payload.data.toString();
    }
    return { endpoint: clusterEndpoint, cert: clusterCert };
}
async function createKubeconfigWithToken() {
    const { endpoint, cert } = await getClusterInfo();
    // Get fresh access token
    const authClient = await auth.getClient();
    const accessTokenResponse = await authClient.getAccessToken();
    if (!accessTokenResponse.token) {
        throw new Error('Failed to obtain access token from Google Auth');
    }
    // Create new kubeconfig with fresh token
    const kubeconfigData = {
        apiVersion: 'v1',
        clusters: [
            {
                name: 'my-gke-cluster',
                cluster: {
                    server: `https://${endpoint}`,
                    'certificate-authority-data': cert,
                },
            },
        ],
        users: [
            {
                name: 'cloud-run-service',
                user: {
                    token: accessTokenResponse.token,
                },
            },
        ],
        contexts: [
            {
                name: 'my-context',
                context: {
                    cluster: 'my-gke-cluster',
                    user: 'cloud-run-service',
                },
            },
        ],
        'current-context': 'my-context',
    };
    kubeconfig.loadFromString(JSON.stringify(kubeconfigData));
    return accessTokenResponse.token;
}
async function configureKubeconfig() {
    try {
        logger.info('Configuring KubeConfig from Secret Manager...');
        const token = await createKubeconfigWithToken();
        logger.info('Successfully configured KubeConfig with access token.');
    }
    catch (error) {
        logger.error('FATAL: Could not configure KubeConfig from Secret Manager.', {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
}
// Function to refresh the token by recreating the kubeconfig
async function refreshKubernetesToken() {
    try {
        logger.info('Refreshing Kubernetes access token...');
        await createKubeconfigWithToken();
        // Recreate the API clients with the new config
        coreV1Api = kubeconfig.makeApiClient(CoreV1Api);
        appsV1Api = kubeconfig.makeApiClient(AppsV1Api);
        networkingV1Api = kubeconfig.makeApiClient(NetworkingV1Api);
        logger.info('Successfully refreshed Kubernetes access token and recreated API clients');
    }
    catch (error) {
        logger.error('Failed to refresh Kubernetes token:', {
            error: error.message,
            stack: error.stack,
        });
    }
}
// Refresh token every 45 minutes (tokens expire after 1 hour)
setInterval(refreshKubernetesToken, 45 * 60 * 1000);
// --- STATE MANAGEMENT AND LOCKING ---
// Tracks active sessions and their last activity time
const activeSessions = new Map();
// This Set stores the replId of resources currently being created or deleted.
const operationLocks = new Set();
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
// --- KUBERNETES HELPER FUNCTIONS ---
const readAndParseKubeYaml = (filePath, replId) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return yaml.parseAllDocuments(fileContent).map((doc) => {
        const parsed = doc.toJSON();
        if (parsed.kind === 'ServiceAccount')
            return parsed;
        const stringified = JSON.stringify(parsed);
        const replaced = stringified.replace(/service_name/g, replId);
        return JSON.parse(replaced);
    });
};
const checkIfResourceExists = async (replId, namespace = 'default') => {
    try {
        // We only check for the deployment as a proxy for all resources.
        await appsV1Api.readNamespacedDeployment(replId, namespace);
        return true;
    }
    catch (error) {
        if (error.response?.statusCode === 404) {
            return false; // Not found is a valid outcome
        }
        throw error; // Re-throw other errors
    }
};
const deleteResources = async (replId, namespace = 'default') => {
    const deletePromises = [
        appsV1Api
            .deleteNamespacedDeployment(replId, namespace)
            .catch((err) => err.response?.statusCode === 404 ? null : Promise.reject(err)),
        coreV1Api
            .deleteNamespacedService(replId, namespace)
            .catch((err) => err.response?.statusCode === 404 ? null : Promise.reject(err)),
        networkingV1Api
            .deleteNamespacedIngress(replId, namespace)
            .catch((err) => err.response?.statusCode === 404 ? null : Promise.reject(err)),
    ];
    await Promise.all(deletePromises);
    // NOTE: This fixed delay is not foolproof. Kubernetes deletion is async.
    // A better approach would be to poll/watch until the resources are confirmed deleted.
    // However, for this use case, a short delay is a reasonable compromise.
    await new Promise((resolve) => setTimeout(resolve, 2000));
};
const createResources = async (manifests, namespace) => {
    for (const manifest of manifests) {
        switch (manifest.kind) {
            case 'ServiceAccount':
                try {
                    await coreV1Api.createNamespacedServiceAccount(namespace, manifest);
                    logger.info('ServiceAccount created.', {
                        name: manifest.metadata.name,
                    });
                }
                catch (err) {
                    if (err.response?.statusCode !== 409)
                        throw err;
                    logger.warn('ServiceAccount already exists, skipping.', {
                        name: manifest.metadata.name,
                    });
                }
                break;
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
// --- INACTIVITY CLEANUP ---
setInterval(() => {
    const now = new Date();
    for (const [replId, session] of activeSessions.entries()) {
        // Check if a lock is active for this replId before cleaning up.
        if (operationLocks.has(replId)) {
            logger.warn('Skipping cleanup for session with active operation.', {
                replId,
            });
            continue;
        }
        const inactiveDuration = now.getTime() - session.lastActivityTime.getTime();
        if (inactiveDuration > INACTIVITY_TIMEOUT) {
            logger.info('Session expired, queueing cleanup.', { replId });
            // Acquire lock before async deletion
            operationLocks.add(replId);
            deleteResources(replId, 'default')
                .then(() => {
                activeSessions.delete(replId);
                logger.info('Successfully deleted resources for expired session.', {
                    replId,
                });
            })
                .catch((error) => {
                logger.error('Failed to delete resources for expired session.', {
                    replId,
                    error: error.message,
                });
            })
                .finally(() => {
                // Always release the lock.
                operationLocks.delete(replId);
            });
        }
    }
}, 60 * 1000);
// --- API ENDPOINTS ---
app.post('/start', async (req, res) => {
    const { replId, userId } = req.body;
    const namespace = 'default';
    logger.info('Start request received.', { replId, userId });
    // Prevent race condition by checking and acquiring a lock first.
    if (operationLocks.has(replId)) {
        logger.warn('Operation already in progress for this replId.', { replId });
        return res.status(409).send({
            message: 'Operation already in progress. Please try again shortly.',
        });
    }
    operationLocks.add(replId);
    try {
        // Clean up any old resources just in case they are orphaned.
        logger.info('Checking for and cleaning up any existing resources before start.', { replId });
        await deleteResources(replId, namespace);
        const kubeManifests = readAndParseKubeYaml(path.join(__dirname, '../service.yaml'), replId);
        logger.info('Creating new Kubernetes resources.', { replId });
        await createResources(kubeManifests, namespace);
        activeSessions.set(replId, {
            userId,
            lastActivityTime: new Date(),
        });
        logger.info('Resources created successfully.', { replId });
        res.status(200).send({
            message: 'Resources created successfully',
            serviceUrl: `${replId}.cloudide.site`,
        });
    }
    catch (error) {
        logger.error('Failed to manage resources during /start.', {
            replId,
            error: error.message,
            details: error.response?.body?.message || 'No additional details',
        });
        // Best-effort cleanup on failure
        await deleteResources(replId, namespace).catch((cleanupError) => {
            logger.error('Failed to cleanup after error on /start.', {
                replId,
                error: cleanupError.message,
            });
        });
        activeSessions.delete(replId);
        res.status(500).send({
            message: 'Failed to create resources',
            error: error.message,
        });
    }
    finally {
        // Always release the lock, whether the operation succeeded or failed.
        operationLocks.delete(replId);
        logger.debug('Released operation lock.', { replId });
    }
});
app.post('/stop', async (req, res) => {
    const { replId } = req.body;
    const namespace = 'default';
    logger.info('Stop request received.', { replId });
    // Acquire lock to prevent conflict with /start or cleanup.
    if (operationLocks.has(replId)) {
        logger.warn('Cannot stop, an operation is already in progress.', { replId });
        return res.status(409).send({
            message: 'Operation already in progress. Please try again shortly.',
        });
    }
    operationLocks.add(replId);
    try {
        await deleteResources(replId, namespace);
        activeSessions.delete(replId);
        logger.info('Resources deleted successfully.', { replId });
        res.status(200).send({ message: 'Resources deleted successfully' });
    }
    catch (error) {
        logger.error('Failed to delete resources during /stop.', {
            replId,
            error: error.message,
        });
        res.status(500).send({
            message: 'Failed to delete resources',
            error: error.message,
        });
    }
    finally {
        // Always release the lock.
        operationLocks.delete(replId);
    }
});
app.post('/activity', async (req, res) => {
    const { replId } = req.body;
    if (activeSessions.has(replId)) {
        activeSessions.get(replId).lastActivityTime = new Date();
        logger.debug('Activity updated.', { replId });
    }
    res.status(200).send({ message: 'Activity updated' });
});
app.get('/stats/:replId', async (req, res) => {
    const { replId } = req.params;
    const namespace = 'default';
    logger.info('Stats request received.', { replId });
    try {
        const deployment = await appsV1Api.readNamespacedDeployment(replId, namespace);
        const pods = await coreV1Api.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, `app=${replId}`);
        res.status(200).send({
            deploymentStatus: deployment.body.status,
            podCount: pods.body.items.length,
            pods: pods.body.items.map((p) => ({
                name: p.metadata.name,
                status: p.status.phase,
            })),
        });
    }
    catch (error) {
        logger.error('Failed to fetch stats.', {
            replId,
            error: error.message,
            details: error.response?.body?.message || 'No additional details',
        });
        if (error.response?.statusCode === 404) {
            return res.status(404).send({ message: 'Resources not found for replId.' });
        }
        res
            .status(500)
            .send({ message: 'Failed to fetch stats', error: error.message });
    }
});
// --- SERVER STARTUP ---
configureKubeconfig().then(() => {
    coreV1Api = kubeconfig.makeApiClient(CoreV1Api);
    appsV1Api = kubeconfig.makeApiClient(AppsV1Api);
    networkingV1Api = kubeconfig.makeApiClient(NetworkingV1Api);
    const port = parseInt(process.env.PORT || '8080', 10);
    app.listen(port, '0.0.0.0', () => {
        logger.info(`Orchestration service listening on *:${port}`);
    });
});
