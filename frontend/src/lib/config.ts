export const API = {
  ORCHESTRATOR: import.meta.env.VITE_API_URL_ORCHESTRATOR,
  INIT: import.meta.env.VITE_API_URL_INIT,
  SOCKET_BASE: import.meta.env.VITE_SOCKET_BASE_URL,
};

// export function getSocketUrl(replId: string): string {
//   if (import.meta.env.MODE === 'development') {
//     // Local Docker container
//     return API.SOCKET_BASE;
//   }
//   // Prod → dynamic subdomain per replId
//   return `http://${replId}.cloudide.site`;
// }

export function getSocketUrl(replId: string): string {
  const useCloud = true; // toggle manually
  return useCloud ? `https://${replId}.cloudide.site` : 'http://localhost:3001';
}
