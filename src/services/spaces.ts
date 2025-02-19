import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export interface SpacesCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

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

export class SpacesClient {
  private client: S3Client;

  constructor(credentials: SpacesCredentials) {
    this.client = new S3Client({
      endpoint: `https://${credentials.region}.digitaloceanspaces.com`,
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      },
      forcePathStyle: true,  // This can help with CORS issues
      customUserAgent: 'aws-sdk-js'  // Use standard AWS SDK user agent
    });
  }

  get region(): string {
    return this.client.config.region?.toString() || '';
  }

  async listBuckets() {
    const command = new ListBucketsCommand({});
    const response = await this.client.send(command);
    return response.Buckets?.map(bucket => ({
      name: bucket.Name || '',
      region: this.region,
      created_at: bucket.CreationDate?.toISOString() || new Date().toISOString()
    })) || [];
  }

  async listObjects(bucketName: string, prefix: string = '') {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix
    });
    const response = await this.client.send(command);
    return response.Contents?.map(obj => ({
      name: obj.Key || '',
      size: obj.Size || 0,
      last_modified: obj.LastModified?.toISOString() || '',
      etag: (obj.ETag || '').replace(/"/g, '')
    })) || [];
  }
}

export const createSpacesClient = (credentials: SpacesCredentials): SpacesClient => {
  return new SpacesClient(credentials);
};

// Type definitions for compatibility with existing code
export type { SpacesBucket as Bucket };
export type { SpacesObject as Object }; 