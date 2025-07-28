import React from 'react';
import {
  Card, CardContent, CardActions, Typography, Box,
  Chip, Button, IconButton
} from '@mui/material';
import {
  PhoneAndroid, Computer, Tablet, WifiOff, Delete, DevicesOutlined
} from '@mui/icons-material';

const DeviceCard = ({ device, onConnect, onDisconnect, onDelete }) => {
  // Get icon based on device name
  const getDeviceIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('phone') || lowerName.includes('iphone') || lowerName.includes('android')) {
      return <PhoneAndroid />;
    } else if (lowerName.includes('tablet') || lowerName.includes('ipad')) {
      return <Tablet />;
    } else {
      return <Computer />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {getDeviceIcon(device.name)}
            <span style={{ marginLeft: '8px' }}>{device.name}</span>
          </Typography>
          <Chip 
            color={device.is_connected ? "success" : "default"}
            label={device.is_connected ? "Connecté" : "Déconnecté"}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          MAC: {device.mac_address}
        </Typography>
        
        {device.last_connected && (
          <Typography variant="body2" color="text.secondary">
            Dernière connexion: {new Date(device.last_connected).toLocaleString()}
          </Typography>
        )}
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          color={device.is_connected ? "error" : "primary"}
          startIcon={device.is_connected ? <WifiOff /> : <DevicesOutlined />}
          onClick={() => device.is_connected ? onDisconnect(device.id) : onConnect(device.id)}
        >
          {device.is_connected ? "Déconnecter" : "Connecter"}
        </Button>
        
        <Box flexGrow={1} />
        
        <IconButton 
          color="error" 
          size="small"
          onClick={() => onDelete(device.id)}
        >
          <Delete />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default DeviceCard;