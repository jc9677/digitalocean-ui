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

async function hmacSHA1(key: string, message: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(key);
  const messageBytes = new TextEncoder().encode(message);
  
  // Create HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  // Sign the message
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);

  // Convert to base64
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(signature))));
}

export class SpacesClient {
  private endpoint: string;
  private credentials: SpacesCredentials;
  readonly region: string;

  constructor(credentials: SpacesCredentials) {
    console.log('Initializing SpacesClient...');
    console.log('Region:', credentials.region);
    this.credentials = credentials;
    this.region = credentials.region;
    this.endpoint = `${this.region}.digitaloceanspaces.com`;
    console.log('Endpoint:', this.endpoint);
    console.log('SpacesClient initialized successfully');
  }

  private async signRequest(method: string, path: string, headers: Record<string, string>): Promise<string> {
    const timestamp = headers['Date'];
    const stringToSign = `${method}\n\n\n${timestamp}\n/${path}`;
    const signature = await hmacSHA1(this.credentials.secretAccessKey, stringToSign);
    return `AWS ${this.credentials.accessKeyId}:${signature}`;
  }

  private async request(path: string, options: RequestInit = {}) {
    const method = options.method || 'GET';
    const timestamp = new Date().toUTCString();
    const url = `https://${this.endpoint}${path}`;
    
    const headers: Record<string, string> = {
      'Date': timestamp,
      'Host': this.endpoint,
      'Origin': window.location.origin,
      'Content-Type': 'application/xml',
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': 'authorization,content-type,date,host,origin',
      'Access-Control-Expose-Headers': 'ETag'
    };

    // Sign the request
    headers['Authorization'] = await this.signRequest(method, path.replace(/^\//, ''), headers);

    console.log('Making API request...');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Headers:', {
      ...headers,
      'Authorization': 'AWS [REDACTED]', // Don't log the actual credentials
    });

    try {
      console.log('Initiating fetch request...');
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('Received response:');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response body:', text);
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}, body: ${text}`);
      }

      const text = await response.text();
      console.log('Response text:', text);

      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      return this.parseResponse(xmlDoc);
    } catch (error: any) {
      console.error('Request failed:', error);
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

  private parseResponse(xml: Document) {
    const result: { spaces?: SpacesBucket[], objects?: SpacesObject[] } = {};

    // Check for errors first
    const errorNode = xml.querySelector('Error');
    if (errorNode) {
      const code = errorNode.querySelector('Code')?.textContent;
      const message = errorNode.querySelector('Message')?.textContent;
      throw new Error(`S3 Error: ${code} - ${message}`);
    }

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
      const response = await this.request('/');
      console.log('Received buckets response:', response);
      return response.spaces || [];
    } catch (error: any) {
      console.error('Error listing buckets:', error);
      throw new Error(`Failed to list buckets: ${error.message}`);
    }
  }

  async listObjects(bucketName: string, prefix: string = '') {
    try {
      console.log(`Listing objects in bucket: ${bucketName}`);
      console.log('Prefix:', prefix);
      const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
      const response = await this.request(`/${bucketName}${query}`);
      console.log('Received objects response:', response);
      return response.objects || [];
    } catch (error: any) {
      console.error('Error listing objects:', error);
      throw new Error(`Failed to list objects in bucket ${bucketName}: ${error.message}`);
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