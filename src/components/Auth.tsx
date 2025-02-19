import React, { useState, useEffect, ChangeEvent } from 'react';
import { Box, TextField, Button, Typography, Paper, Link, Alert } from '@mui/material';
import { SpacesCredentials, getStoredCredentials, storeCredentials, clearCredentials, createSpacesClient } from '../services/spaces';

interface AuthProps {
  onAuthenticated: (credentials: SpacesCredentials) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [credentials, setCredentials] = useState<SpacesCredentials>({
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredCredentials();
    if (stored) {
      setCredentials(stored);
      testConnection(stored);
    }
  }, []);

  const testConnection = async (creds: SpacesCredentials) => {
    try {
      setTestStatus('Testing connection...');
      const client = createSpacesClient(creds);
      setTestStatus('Client created, attempting to list buckets...');
      await client.listBuckets();
      setTestStatus('Connection successful! Authenticating...');
      setError(null);
      onAuthenticated(creds);
    } catch (err: any) {
      console.error('Connection test failed:', err);
      setError(`Connection failed: ${err.message}`);
      setTestStatus(null);
      
      // Additional error details
      if (err instanceof TypeError) {
        setError(prev => `${prev}\n\nNetwork Error Details:\n` +
          `- Is CORS error: ${err.message.includes('CORS')}\n` +
          `- Is network error: ${err.message.includes('network')}\n` +
          `- Is SSL error: ${err.message.includes('SSL')}\n` +
          `\nFull error: ${err.message}`
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTestStatus('Saving credentials...');
    storeCredentials(credentials);
    await testConnection(credentials);
  };

  const handleClear = () => {
    clearCredentials();
    setCredentials({
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
    });
    setError(null);
    setTestStatus(null);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Digital Ocean API Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please enter your Digital Ocean API token and region. You can generate an API token in your{' '}
          <Link href="https://cloud.digitalocean.com/account/api/tokens" target="_blank" rel="noopener">
            Digital Ocean Account Settings
          </Link>
          .
        </Typography>

        {testStatus && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {testStatus}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="API Token"
            value={credentials.accessKeyId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
            required
            helperText="Enter your Digital Ocean API token"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Region (e.g. nyc3)"
            value={credentials.region}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCredentials({ ...credentials, region: e.target.value })}
            required
            helperText="Enter the region where your Spaces are located"
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              Test Connection & Save
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClear}>
              Clear Configuration
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Debug Information:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            mt: 1, 
            p: 2, 
            bgcolor: 'grey.100', 
            borderRadius: 1,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            Base URL: https://api.digitalocean.com/v2
            Region: {credentials.region}
            Token Length: {credentials.accessKeyId.length}
            Has Stored Credentials: {getStoredCredentials() ? 'Yes' : 'No'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}; 