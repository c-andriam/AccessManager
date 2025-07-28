import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Switch, FormControlLabel,
  TablePagination, Box, Chip, InputAdornment, CircularProgress
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Person, Lock
} from '@mui/icons-material';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    active: true
  });
  
  const [passwordForm, setPasswordForm] = useState({
    id: null,
    password: '',
    confirmPassword: ''
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle dialog opening
  const handleAddUser = () => {
    setCurrentUser(null);
    setUserForm({
      username: '',
      email: '',
      password: '',
      role: 'user',
      active: true
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      // We don't populate the password when editing
      password: '',
      role: user.role,
      active: user.active
    });
    setDialogOpen(true);
  };

  const handleResetPassword = (user) => {
    setPasswordForm({
      id: user.id,
      password: '',
      confirmPassword: ''
    });
    setPasswordDialogOpen(true);
  };

  // Handle form submission
  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (currentUser) {
        // Update existing user
        const { password, ...updateData } = userForm; // Remove password if empty
        
        await axios.put(`/api/admin/users/${currentUser.id}`, 
          updateData, 
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
      } else {
        // Create new user
        await axios.post('/api/admin/users',
          userForm,
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
      }
      
      // Close dialog and refresh users
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Erreur lors de l\'enregistrement de l\'utilisateur');
    }
  };

  // Handle password reset
  const handleSavePassword = async () => {
    if (passwordForm.password !== passwordForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${passwordForm.id}/reset-password`,
        { password: passwordForm.password },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      setPasswordDialogOpen(false);
      alert('Mot de passe réinitialisé avec succès');
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.username} ?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <Person sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Gestion des utilisateurs
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />} 
          onClick={handleAddUser}
        >
          Nouvel utilisateur
        </Button>
      </Box>
      
      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>
      
      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Appareils</TableCell>
              <TableCell>Dernière connexion</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers