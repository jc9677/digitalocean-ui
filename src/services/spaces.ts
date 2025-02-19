export interface SpacesCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

// Local storage keys
const CREDENTIALS_KEY = 'spaces_credentials';

export const getStoredCredentials = (): SpacesCredentials | null => {
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const storeCredentials = (credentials: SpacesCredentials): void => {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
};

export const clearCredentials = (): void => {
  localStorage.removeItem(CREDENTIALS_KEY);
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
    this.credentials = credentials;
    this.region = credentials.region;
    this.baseUrl = 'https://api.digitalocean.com/v2';
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.credentials.accessKeyId}`,
      'Content-Type': 'application/json',
    };

    try {
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response:', data);
      return data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async listBuckets() {
    try {
      console.log('Listing buckets...');
      const response = await this.request('/spaces');
      return response.spaces || [];
    } catch (error) {
      console.error('Error listing buckets:', error);
      throw error;
    }
  }

  async listObjects(bucketName: string, prefix: string = '') {
    try {
      console.log(`Listing objects in bucket: ${bucketName}, prefix: ${prefix}`);
      const response = await this.request(`/spaces/${bucketName}/objects?prefix=${encodeURIComponent(prefix)}`);
      return response.objects || [];
    } catch (error) {
      console.error('Error listing objects:', error);
      throw error;
    }
  }
}

// Factory function to create a client
export const createSpacesClient = (credentials: SpacesCredentials): SpacesClient => {
  return new SpacesClient(credentials);
};

// Type definitions for compatibility with existing code
export type { SpacesBucket as Bucket };
export type { SpacesObject as Object }; 