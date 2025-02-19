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
    this.baseUrl = `https://${this.region}.digitaloceanspaces.com`;
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const timestamp = new Date().toUTCString();
    const headers = {
      'Authorization': `AWS ${this.credentials.accessKeyId}:${this.credentials.secretAccessKey}`,
      'Date': timestamp,
      'Content-Type': 'application/xml',
      'x-amz-date': timestamp.replace(/\s/g, 'T').replace(/:/g, '-'),
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

      const text = await response.text();
      console.log('Response:', text);
      
      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      return this.parseResponse(xmlDoc);
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  private parseResponse(xml: Document) {
    const result: { spaces?: SpacesBucket[], objects?: SpacesObject[] } = {};

    // Parse bucket list response
    const buckets = xml.getElementsByTagName('Bucket');
    if (buckets.length > 0) {
      result.spaces = Array.from(buckets).map(bucket => ({
        name: bucket.getElementsByTagName('Name')[0]?.textContent || '',
        region: this.region,
        created_at: bucket.getElementsByTagName('CreationDate')[0]?.textContent || new Date().toISOString()
      }));
    }

    // Parse object list response
    const contents = xml.getElementsByTagName('Contents');
    if (contents.length > 0) {
      result.objects = Array.from(contents).map(obj => ({
        name: obj.getElementsByTagName('Key')[0]?.textContent || '',
        size: parseInt(obj.getElementsByTagName('Size')[0]?.textContent || '0', 10),
        last_modified: obj.getElementsByTagName('LastModified')[0]?.textContent || '',
        etag: (obj.getElementsByTagName('ETag')[0]?.textContent || '').replace(/"/g, '')
      }));
    }

    return result;
  }

  async listBuckets() {
    try {
      console.log('Listing buckets...');
      const response = await this.request('/?location');
      return response.spaces || [];
    } catch (error) {
      console.error('Error listing buckets:', error);
      throw error;
    }
  }

  async listObjects(bucketName: string, prefix: string = '') {
    try {
      console.log(`Listing objects in bucket: ${bucketName}, prefix: ${prefix}`);
      const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
      const response = await this.request(`/${bucketName}${query}`);
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