import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = 'tracktally_pin';

export async function hasPinSet() {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return pin !== null;
}

export async function setPin(pin) {
  await AsyncStorage.setItem(PIN_KEY, pin);
}

export async function verifyPin(pin) {
  const stored = await AsyncStorage.getItem(PIN_KEY);
  return stored === pin;
}

export async function clearPin() {
  await AsyncStorage.removeItem(PIN_KEY);
}