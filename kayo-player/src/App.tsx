import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemo } from 'react';
import { createHashRouter, RouterProvider } from 'react-router';

import { listObjects } from './api';
import CastControl from './component/CastControl';
import MediaChooser from './component/MediaChooser';
import CastProvider from './context/CastProvider';

const router = createHashRouter([
  {
    path: '*',
    loader: ({ params }) => listObjects(params['*']),
    Component: MediaChooser,
  },
]);

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
    },
  }), [prefersDarkMode]);

  return (
    <ThemeProvider theme={theme} noSsr>
      <CssBaseline />
      <CastProvider receiverApplicationId="5C78621A">
        <RouterProvider router={router} />
        <CastControl />
      </CastProvider>
    </ThemeProvider>
  );
}

export default App;
