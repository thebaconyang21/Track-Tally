import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import PinScreen from './src/screens/PinScreen';
import { initDatabase } from './src/db/database';
import { hasPinSet } from './src/utils/pin';

export default function App() {
  const [ready, setReady] = useState(false);
  const [pinMode, setPinMode] = useState(null); // 'setup' | 'unlock' | null
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    initDatabase();
    checkPin();
  }, []);

  // Re-lock whenever the app comes back from the background — this is
  // what makes the PIN meaningful, not just a one-time launch screen.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && ready) {
        checkPin();
      }
      if (state === 'background') {
        setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [ready]);

  async function checkPin() {
    const exists = await hasPinSet();
    setPinMode(exists ? 'unlock' : 'setup');
    setReady(true);
  }

  if (!ready) return null; // brief blank frame while checking AsyncStorage

  if (!unlocked) {
    return (
      <>
        <StatusBar style="light" />
        <PinScreen mode={pinMode} onSuccess={() => { setUnlocked(true); setPinMode('unlock'); }} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}