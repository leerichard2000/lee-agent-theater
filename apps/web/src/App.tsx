import { useEffect } from 'react';
import { TheaterLayout } from './components/TheaterLayout.js';
import { wsService } from './services/websocket.js';

function App() {
  // Conectar WebSocket ao montar
  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);

  return <TheaterLayout />;
}

export default App;
