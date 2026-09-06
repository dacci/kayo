import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Paper } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { useLocation, useNavigate, useRevalidator } from 'react-router';

import CastButton from './CastButton';

function Controller() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const revalidator = useRevalidator();

  return (
    <AppBar position="fixed">
      <Toolbar disableGutters>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <IconButton onClick={() => navigate(1)}>
          <ArrowForwardIcon />
        </IconButton>
        <IconButton onClick={() => revalidator.revalidate()}>
          <RefreshIcon />
        </IconButton>
        <Paper sx={{ flex: 1, marginX: 1, paddingX: 1 }}>{decodeURIComponent(pathname)}</Paper>
        <CastButton />
      </Toolbar>
    </AppBar>
  );
}

export default Controller;
