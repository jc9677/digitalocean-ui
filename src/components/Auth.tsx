import React, { useState, useEffect, ChangeEvent } from 'react';
import { Box, TextField, Button, Typography, Paper, Link } from '@mui/material';
import { SpacesCredentials, getStoredCredentials, storeCredentials, clearCredentials } from '../services/spaces';

interface AuthProps {
  onAuthenticated: (credentials: SpacesCredentials) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [credentials, setCredentials] = useState<SpacesCredentials>({
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
  });

  useEffect(() => {
    const stored = getStoredCredentials();
    if (stored) {
      setCredentials(stored);
      onAuthenticated(stored);
    }
  }, [onAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storeCredentials(credentials);
    onAuthenticated(credentials);
  };

  const handleClear = () => {
    clearCredentials();
    setCredentials({
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
    });
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
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
              Save Configuration
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClear}>
              Clear Configuration
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}; 