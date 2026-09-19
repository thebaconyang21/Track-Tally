import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import DebtorsScreen from '../screens/DebtorsScreen';
import SellScreen from '../screens/SellScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

// Maps each tab name to an icon. Using Ionicons which ships with Expo.
function getIconName(routeName, focused) {
  switch (routeName) {
    case 'Home':
      return focused ? 'home' : 'home-outline';
    case 'Debtors':
      return focused ? 'people' : 'people-outline';
    case 'Sell':
      return focused ? 'cart' : 'cart-outline';
    case 'Inventory':
      return focused ? 'cube' : 'cube-outline';
    case 'Reports':
      return focused ? 'bar-chart' : 'bar-chart-outline';
    default:
      return 'ellipse-outline';
  }
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.inactive,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={getIconName(route.name, focused)} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Debtors" component={DebtorsScreen} />
        <Tab.Screen name="Sell" component={SellScreen} />
        <Tab.Screen name="Inventory" component={InventoryScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}