import React, { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import { FolderOutlined, InsertDriveFileOutlined, ArrowBack } from '@mui/icons-material';
import { S3Client } from '@aws-sdk/client-s3';
import { listObjects } from '../services/spaces';

interface BucketViewProps {
  client: S3Client;
  bucketName: string;
  onBack: () => void;
}

interface FileItem {
  Key: string;
  Size: number;
  LastModified: Date;
}

export const BucketView: React.FC<BucketViewProps> = ({ client, bucketName, onBack }) => {
  const [objects, setObjects] = useState<FileItem[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObjects = async (prefix: string) => {
    try {
      setLoading(true);
      const objectList = await listObjects(client, bucketName, prefix);
      setObjects(objectList as FileItem[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch objects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects(currentPrefix);
  }, [client, bucketName, currentPrefix]);

  const handleFolderClick = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  const handleFileClick = (key: string) => {
    const url = `https://${bucketName}.${client.config.region}.digitaloceanspaces.com/${key}`;
    window.open(url, '_blank');
  };

  const getBreadcrumbs = () => {
    const parts = currentPrefix.split('/').filter(Boolean);
    return [
      <Link
        key="root"
        component="button"
        onClick={() => setCurrentPrefix('')}
        color="inherit"
        sx={{ cursor: 'pointer' }}
      >
        Root
      </Link>,
      ...parts.map((part, index) => {
        const prefix = parts.slice(0, index + 1).join('/') + '/';
        return (
          <Link
            key={prefix}
            component="button"
            onClick={() => setCurrentPrefix(prefix)}
            color="inherit"
            sx={{ cursor: 'pointer' }}
          >
            {part}
          </Link>
        );
      }),
    ];
  };

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

  const folders = new Set<string>();
  const files: FileItem[] = [];

  objects.forEach((obj) => {
    if (!obj.Key) return;
    
    const relativePath = obj.Key.slice(currentPrefix.length);
    const parts = relativePath.split('/');
    
    if (parts.length > 1) {
      folders.add(parts[0]);
    } else if (obj.Key !== currentPrefix) {
      files.push(obj);
    }
  });

  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onBack}>
          <ArrowBack />
        </IconButton>
        <Breadcrumbs>{getBreadcrumbs()}</Breadcrumbs>
      </Box>

      <List>
        {Array.from(folders).map((folder) => (
          <ListItem
            key={folder}
            button
            onClick={() => handleFolderClick(currentPrefix + folder + '/')}
          >
            <ListItemIcon>
              <FolderOutlined />
            </ListItemIcon>
            <ListItemText primary={folder} />
          </ListItem>
        ))}

        {files.map((file) => (
          <ListItem
            key={file.Key}
            button
            onClick={() => handleFileClick(file.Key)}
          >
            <ListItemIcon>
              <InsertDriveFileOutlined />
            </ListItemIcon>
            <ListItemText
              primary={file.Key.split('/').pop()}
              secondary={`Size: ${(file.Size / 1024).toFixed(2)} KB • Modified: ${new Date(file.LastModified).toLocaleString()}`}
            />
          </ListItem>
        ))}

        {folders.size === 0 && files.length === 0 && (
          <ListItem>
            <ListItemText primary="This folder is empty" />
          </ListItem>
        )}
      </List>
    </Box>
  );
}; 