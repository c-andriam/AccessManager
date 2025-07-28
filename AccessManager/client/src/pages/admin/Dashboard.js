import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, 
  CircularProgress, Card, CardContent, CardHeader,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  ListItemSecondaryAction, IconButton, Chip
} from '@mui/material';
import {
  Person, Devices, Block, CheckCircle,
  Warning, TrendingUp, DevicesOther, Visibility
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeDevices, setActiveDevices] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      try {
        // Get stats
        const statsResponse = await axios.get('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setStats(statsResponse.data);
        
        // Get active users
        const usersResponse = await axios.get('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Get only users with active devices
        const active = usersResponse.data
          .filter(user => user.active_devices > 0)
          .sort((a, b) => b.active_devices - a.active_devices)
          .slice(0, 5);
          
        setActiveUsers(active);
        
        // Get active devices
        const devicesResponse = await axios.get('/api/admin/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const activeDevs = devicesResponse.data
          .filter(device => device.is_connected)
          .slice(0, 5);
          
        setActiveDevices(activeDevs);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Refresh every minute
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const prepareChartData = () => {
    if (!stats || !stats.daily_connections) return null;
    
    const labels = stats.daily_connections.map(day => new Date(day.date).toLocaleDateString());
    const data = stats.daily_connections.map(day => day.count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Connexions par jour',
          data,
          fill: false,
          backgroundColor: 'rgb(75, 192, 192)',
          borderColor: 'rgba(75, 192, 192, 0.2)',
        }
      ]
    };
  };
  
  const chartData = prepareChartData();
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    maintainAspectRatio: false
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de bord
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.light',
              color: 'white'
            }}
          >
            <Person fontSize="large" />
            <Typography variant="h5" component="div" sx={{ mt: 1 }}>
              {stats?.total_users || 0}
            </Typography>
            <Typography variant="body2">Utilisateurs</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'white'
            }}
          >
            <DevicesOther fontSize="large" />
            <Typography variant="h5" component="div" sx={{ mt: 1 }}>
              {stats?.total_devices || 0}
            </Typography>
            <Typography variant="body2">Appareils enregistrés</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'info.light',
              color: 'white'
            }}
          >
            <Devices fontSize="large" />
            <Typography variant="h5" component="div" sx={{ mt: 1 }}>
              {stats?.connected_devices || 0}
            </Typography>
            <Typography variant="body2">Appareils connectés</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'warning.light',
              color: 'white'
            }}
          >
            <Block fontSize="large" />
            <Typography variant="h5" component="div" sx={{ mt: 1 }}>
              {stats?.blocked_devices || 0}
            </Typography>
            <Typography variant="body2">Appareils bloqués</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Connection Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
            }}
          >
            <Typography variant="h6" component="h3" gutterBottom>
              <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Statistiques de connexions (7 derniers jours)
            </Typography>
            
            {chartData ? (
              <Box height="250px">
                <Line data={chartData} options={chartOptions} />
              </Box>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body1" color="text.secondary">
                  Pas assez de données
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Active Users and Devices */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Utilisateurs actifs"
              avatar={<Person color="primary" />}
            />
            <CardContent>
              {activeUsers.length > 0 ? (
                <List>
                  {activeUsers.map(user => (
                    <ListItem key={user.id}>
                      <ListItemAvatar>
                        <Avatar>{user.username[0].toUpperCase()}</Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.username} 
                        secondary={user.email}
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          label={`${user.active_devices} appareil${user.active_devices > 1 ? 's' : ''}`}
                          color="primary"
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun utilisateur actif actuellement
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Appareils connectés"
              avatar={<DevicesOther color="secondary" />}
            />
            <CardContent>
              {activeDevices.length > 0 ? (
                <List>
                  {activeDevices.map(device => (
                    <ListItem key={device.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light' }}>
                          <Devices />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={device.name} 
                        secondary={`${device.username} - ${device.mac_address}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="view">
                          <Visibility />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun appareil connecté actuellement
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;