import React, { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Auth } from './components/Auth';
import { BucketList } from './components/BucketList';
import { BucketView } from './components/BucketView';
import { SpacesCredentials, createS3Client } from './services/spaces';
import { S3Client } from '@aws-sdk/client-s3';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0069ff',
    },
    secondary: {
      main: '#00d7d2',
    },
  },
});

function App() {
  const [client, setClient] = useState<S3Client | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  const handleAuthenticated = (credentials: SpacesCredentials) => {
    const newClient = createS3Client(credentials);
    setClient(newClient);
    setSelectedBucket(null);
  };

  const handleSelectBucket = (bucketName: string) => {
    setSelectedBucket(bucketName);
  };

  const handleBack = () => {
    setSelectedBucket(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {!client ? (
          <Auth onAuthenticated={handleAuthenticated} />
        ) : selectedBucket ? (
          <BucketView
            client={client}
            bucketName={selectedBucket}
            onBack={handleBack}
          />
        ) : (
          <BucketList client={client} onSelectBucket={handleSelectBucket} />
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
