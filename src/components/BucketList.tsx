import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, CircularProgress } from '@mui/material';
import { S3Client } from '@aws-sdk/client-s3';
import { listBuckets } from '../services/spaces';

interface BucketListProps {
  client: S3Client;
  onSelectBucket: (bucketName: string) => void;
}

export const BucketList: React.FC<BucketListProps> = ({ client, onSelectBucket }) => {
  const [buckets, setBuckets] = useState<Array<{ Name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        setLoading(true);
        const bucketList = await listBuckets(client);
        setBuckets(bucketList);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch buckets');
      } finally {
        setLoading(false);
      }
    };

    fetchBuckets();
  }, [client]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ p: 2 }}>
        Your Spaces Buckets
      </Typography>
      <List>
        {buckets.map((bucket) => (
          <ListItem key={bucket.Name} disablePadding>
            <ListItemButton onClick={() => onSelectBucket(bucket.Name!)}>
              <ListItemText primary={bucket.Name} />
            </ListItemButton>
          </ListItem>
        ))}
        {buckets.length === 0 && (
          <ListItem>
            <ListItemText primary="No buckets found" />
          </ListItem>
        )}
      </List>
    </Box>
  );
}; 