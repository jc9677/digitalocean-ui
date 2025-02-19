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

// Custom fetch function with no-cors mode
const customFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    mode: 'no-cors',
    credentials: 'omit'
  });
  return response;
};

export const createS3Client = (credentials: SpacesCredentials): S3Client => {
  const endpoint = `https://${credentials.region}.digitaloceanspaces.com`;
  console.log('Creating S3 client with endpoint:', endpoint);
  
  return new S3Client({
    endpoint,
    region: 'us-east-1', // Digital Ocean expects this
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    forcePathStyle: true,
    requestHandler: {
      abortSignal: undefined,
      connectionTimeout: 5000,
      keepAlive: true,
      handlerProtocol: 'https',
      // Use our custom fetch function
      fetchFunction: customFetch
    }
  });
};

export const listBuckets = async (client: S3Client) => {
  try {
    console.log('Attempting to list buckets...');
    const command = new ListBucketsCommand({});
    console.log('Sending ListBucketsCommand...');
    const response = await client.send(command);
    console.log('List buckets response:', response);
    return response.Buckets || [];
  } catch (error) {
    console.error('Error listing buckets:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export const listObjects = async (client: S3Client, bucketName: string, prefix: string = '') => {
  try {
    console.log(`Attempting to list objects in bucket: ${bucketName}, prefix: ${prefix}`);
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });
    console.log('Sending ListObjectsV2Command...');
    const response = await client.send(command);
    console.log('List objects response:', response);
    return response.Contents || [];
  } catch (error) {
    console.error('Error listing objects:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}; 