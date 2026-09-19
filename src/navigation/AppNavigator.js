import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import DebtorsScreen from '../screens/DebtorsScreen';
import DebtorFormScreen from '../screens/DebtorFormScreen';
import DebtorDetailScreen from '../screens/DebtorDetailScreen';
import RecordPaymentScreen from '../screens/RecordPaymentScreen';
import SellScreen from '../screens/SellScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const InventoryStack = createNativeStackNavigator();
const DebtorsStack = createNativeStackNavigator();

function InventoryStackScreen() {
  return (
    <InventoryStack.Navigator>
      <InventoryStack.Screen name="InventoryList" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <InventoryStack.Screen name="ProductForm" component={ProductFormScreen} />
    </InventoryStack.Navigator>
  );
}

function DebtorsStackScreen() {
  return (
    <DebtorsStack.Navigator>
      <DebtorsStack.Screen name="DebtorsList" component={DebtorsScreen} options={{ title: 'Debtors' }} />
      <DebtorsStack.Screen name="DebtorForm" component={DebtorFormScreen} />
      <DebtorsStack.Screen name="DebtorDetail" component={DebtorDetailScreen} />
      <DebtorsStack.Screen
        name="RecordPayment"
        component={RecordPaymentScreen}
        options={{ title: 'Record Payment' }}
      />
    </DebtorsStack.Navigator>
  );
}

function getIconName(routeName, focused) {
  switch (routeName) {
    case 'Home': return focused ? 'home' : 'home-outline';
    case 'Debtors': return focused ? 'people' : 'people-outline';
    case 'Sell': return focused ? 'cart' : 'cart-outline';
    case 'Inventory': return focused ? 'cube' : 'cube-outline';
    case 'Reports': return focused ? 'bar-chart' : 'bar-chart-outline';
    default: return 'ellipse-outline';
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
        <Tab.Screen name="Debtors" component={DebtorsStackScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Sell" component={SellScreen} />
        <Tab.Screen name="Inventory" component={InventoryStackScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}