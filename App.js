import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';

import RootNavigation from './navigation';

export default function App() {
	return (
		<ThemeProvider>
			<RootNavigation />
		</ThemeProvider>
	);
};