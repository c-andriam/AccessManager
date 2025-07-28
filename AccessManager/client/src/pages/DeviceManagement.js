import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions,
  Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Box, Alert, CircularProgress
} from '@mui/material';
import { 
  DevicesOutlined, PhoneAndroid, Computer, Tablet, 
  WifiOff, Delete, Add, Refresh
} from '@mui/icons-material';
import axios from 'axios';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', mac_address: '' });
  const [deviceLimit, setDeviceLimit] = useState(4);

  // Fetch devices
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDevices(response.data);
      
      // Get device limit from settings
      const settingsResponse = await axios.get('/api/users/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (settingsResponse.data && settingsResponse.data.max_devices_per_user) {
        setDeviceLimit(parseInt(settingsResponse.data.max_devices_per_user));
      }
      
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des appareils');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Handle device connection toggle
  const toggleDeviceConnection = async (id, isConnected) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/devices/${id}/status`, 
        { connect: !isConnected },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      // Refresh devices list
      fetchDevices();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement d\'état de l\'appareil');
    }
  };

  // Handle device deletion
  const deleteDevice = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet appareil ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/devices/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Remove from local state
        setDevices(devices.filter(device => device.id !== id));
      } catch (err) {
        setError('Erreur lors de la suppression de l\'appareil');
      }
    }
  };

  // Handle adding new device
  const addDevice = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/devices', newDevice, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Reset form and close dialog
      setNewDevice({ name: '', mac_address: '' });
      setAddDialogOpen(false);
      
      // Refresh devices list
      fetchDevices();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'appareil');
    }
  };

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <DevicesOutlined sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Mes appareils
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchDevices}
            sx={{ mr: 1 }}
          >
            Actualiser
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => setAddDialogOpen(true)}
            disabled={devices.length >= deviceLimit}
          >
            Ajouter un appareil
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : devices.length === 0 ? (
        <Alert severity="info">
          Vous n'avez pas encore d'appareil enregistré. Ajoutez un appareil pour commencer.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {devices.map(device => (
            <Grid item xs={12} sm={6} md={4} key={device.id}>
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
                    onClick={() => toggleDeviceConnection(device.id, device.is_connected)}
                  >
                    {device.is_connected ? "Déconnecter" : "Connecter"}
                  </Button>
                  
                  <Box flexGrow={1} />
                  
                  <IconButton 
                    color="error" 
                    size="small"
                    onClick={() => deleteDevice(device.id)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Add Device Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Ajouter un appareil</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Nom de l'appareil"
            type="text"
            fullWidth
            variant="outlined"
            value={newDevice.name}
            onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
          />
          
          <TextField
            margin="dense"
            id="mac"
            label="Adresse MAC"
            helperText="Format: AA:BB:CC:DD:EE:FF"
            type="text"
            fullWidth
            variant="outlined"
            value={newDevice.mac_address}
            onChange={(e) => setNewDevice({...newDevice, mac_address: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Annuler</Button>
          <Button onClick={addDevice} variant="contained">Ajouter</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DeviceManagement;