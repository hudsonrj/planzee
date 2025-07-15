import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "67d04defdf38de9f23354a9a", 
  requiresAuth: true // Ensure authentication is required for all operations
});
