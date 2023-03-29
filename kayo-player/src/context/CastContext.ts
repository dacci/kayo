import {createContext} from 'react';

const CastContext = createContext<{
  available: boolean,
  player?: cast.framework.RemotePlayer,
  playerController?: cast.framework.RemotePlayerController,
}>({
  available: false,
});

export default CastContext;
