export interface SpacesCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

// Local storage keys
const CREDENTIALS_KEY = 'spaces_credentials';

export const getStoredCredentials = (): SpacesCredentials | null => {
  console.log('Retrieving stored credentials...');
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (stored) {
    console.log('Found stored credentials');
  } else {
    console.log('No stored credentials found');
  }
  return stored ? JSON.parse(stored) : null;
};

export const storeCredentials = (credentials: SpacesCredentials): void => {
  console.log('Storing new credentials...');
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  console.log('Credentials stored successfully');
};

export const clearCredentials = (): void => {
  console.log('Clearing stored credentials...');
  localStorage.removeItem(CREDENTIALS_KEY);
  console.log('Credentials cleared successfully');
};

interface SpacesBucket {
  name: string;
  region: string;
  created_at: string;
}

interface SpacesObject {
  name: string;
  size: number;
  last_modified: string;
  etag: string;
}

export class SpacesClient {
  private baseUrl: string;
  private credentials: SpacesCredentials;
  readonly region: string;

  constructor(credentials: SpacesCredentials) {
    console.log('Initializing SpacesClient...');
    console.log('Region:', credentials.region);
    console.log('API Token length:', credentials.accessKeyId.length);
    this.credentials = credentials;
    this.region = credentials.region;
    this.baseUrl = 'https://api.digitalocean.com/v2';
    console.log('Base URL:', this.baseUrl);
    console.log('SpacesClient initialized successfully');
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.credentials.accessKeyId}`,
      'Content-Type': 'application/json',
    };

    console.log('Making API request...');
    console.log('URL:', url);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', {
      ...headers,
      'Authorization': 'Bearer [REDACTED]', // Don't log the actual token
      ...options.headers,
    });

    try {
      console.log('Initiating fetch request...');
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log('Received response:');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response body:', text);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}, body: ${text}`);
      }

      console.log('Parsing response as JSON...');
      const data = await response.json();
      console.log('Parsed response data:', data);
      return data;
    } catch (error: any) {
      console.error('Request failed with error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error instanceof TypeError) {
        console.error('Network error details:', {
          isCORS: error.message.includes('CORS'),
          isNetwork: error.message.includes('network'),
          isSSL: error.message.includes('SSL'),
        });
      }
      throw error;
    }
  }

  async listBuckets() {
    try {
      console.log('Listing buckets...');
      console.log('Making request to /spaces endpoint');
      const response = await this.request('/spaces');
      console.log('Received buckets response:', response);
      const buckets = response.spaces || [];
      console.log('Found', buckets.length, 'buckets');
      return buckets;
    } catch (error: any) {
      console.error('Error listing buckets:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async listObjects(bucketName: string, prefix: string = '') {
    try {
      console.log(`Listing objects in bucket: ${bucketName}`);
      console.log('Prefix:', prefix);
      const response = await this.request(`/spaces/${bucketName}/objects?prefix=${encodeURIComponent(prefix)}`);
      console.log('Received objects response:', response);
      const objects = response.objects || [];
      console.log('Found', objects.length, 'objects');
      return objects;
    } catch (error: any) {
      console.error('Error listing objects:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }
}

// Factory function to create a client
export const createSpacesClient = (credentials: SpacesCredentials): SpacesClient => {
  console.log('Creating new SpacesClient...');
  const client = new SpacesClient(credentials);
  console.log('SpacesClient created successfully');
  return client;
};

// Type definitions for compatibility with existing code
export type { SpacesBucket as Bucket };
export type { SpacesObject as Object }; 