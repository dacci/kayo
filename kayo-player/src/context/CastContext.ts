import { createContext } from 'react';

export interface CastContextProps {
  available: boolean,
  player?: cast.framework.RemotePlayer,
  playerController?: cast.framework.RemotePlayerController,
}

const CastContext = createContext<CastContextProps>({
  available: false,
});

export default CastContext;
