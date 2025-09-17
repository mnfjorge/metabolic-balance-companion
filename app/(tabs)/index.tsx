import { useEffect } from 'react';
import { router } from 'expo-router';

export default function IndexRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/suggestions');
  }, []);
  return null;
}
