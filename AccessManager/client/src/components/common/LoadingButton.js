import React from 'react';
import { Button, CircularProgress } from '@mui/material';

const LoadingButton = ({ 
  loading, 
  children, 
  startIcon,
  variant = 'contained',
  color = 'primary',
  ...props 
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      disabled={loading}
      startIcon={loading ? null : startIcon}
      {...props}
    >
      {loading ? (
        <>
          <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;