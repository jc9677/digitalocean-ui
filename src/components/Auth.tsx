import React, { useState, useEffect, ChangeEvent } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
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
          Digital Ocean Spaces Credentials
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Access Key ID"
            value={credentials.accessKeyId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Secret Access Key"
            type="password"
            value={credentials.secretAccessKey}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCredentials({ ...credentials, secretAccessKey: e.target.value })}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Region (e.g. nyc3)"
            value={credentials.region}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCredentials({ ...credentials, region: e.target.value })}
            required
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              Save Credentials
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClear}>
              Clear Credentials
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}; 