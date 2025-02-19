import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

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

export const createS3Client = (credentials: SpacesCredentials): S3Client => {
  return new S3Client({
    endpoint: `https://${credentials.region}.digitaloceanspaces.com`,
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    }
  });
};

export const listBuckets = async (client: S3Client) => {
  const command = new ListBucketsCommand({});
  const response = await client.send(command);
  return response.Buckets || [];
};

export const listObjects = async (client: S3Client, bucketName: string, prefix: string = '') => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  const response = await client.send(command);
  return response.Contents || [];
}; 