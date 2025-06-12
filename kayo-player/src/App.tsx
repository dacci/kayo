import {useMemo} from 'react';
import {createHashRouter, Navigate, RouterProvider} from 'react-router-dom';
import {AppBar, Box, createTheme, CssBaseline, ThemeProvider, useMediaQuery} from '@mui/material';
import {ListObjectsV2Command, S3Client} from '@aws-sdk/client-s3';
import {fromCognitoIdentityPool} from '@aws-sdk/credential-providers';
import './App.css';
import {CastControl, MediaChooser} from './component';
import {CastProvider} from './context';

const BUCKET = import.meta.env.VITE_APP_BUCKET || 'contents';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', {noSsr: true});
  const theme = useMemo(() => createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
    },
  }), [prefersDarkMode]);

  const s3 = useMemo(() => {
    if (import.meta.env.VITE_APP_IDENTITY_POOL_ID) {
      const region = import.meta.env.VITE_APP_IDENTITY_POOL_ID.split(':')[0];
      return new S3Client({
        region,
        credentials: fromCognitoIdentityPool({
          identityPoolId: import.meta.env.VITE_APP_IDENTITY_POOL_ID,
          clientConfig: {region},
        }),
      });
    } else {
      return new S3Client({
        region: 'us-east-1',
        endpoint: import.meta.env.VITE_APP_API_ENDPOINT || window.location.origin + window.location.pathname + 'api',
        forcePathStyle: true,
        credentials: {
          accessKeyId: '',
          secretAccessKey: '',
        },
        signer: {
          async sign(requestToSign) {
            return requestToSign;
          }
        },
      });
    }
  }, []);

  const router = createHashRouter([
    {
      path: '/',
      element: <Navigate to='/contents' replace/>,
    },
    {
      path: '/contents/*',
      loader: async ({params}) => s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: params['*'] as string,
        Delimiter: '/',
      })),
      element: <MediaChooser
        s3Client={s3}
        bucket={BUCKET}
      />,
    },
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <CastProvider receiverApplicationId='5C78621A'>
        <Box className='App'>
          <RouterProvider router={router}/>
          <AppBar position='fixed' sx={{top: 'auto', bottom: 0}}>
            <CastControl/>
          </AppBar>
        </Box>
      </CastProvider>
    </ThemeProvider>
  );
}

export default App;
