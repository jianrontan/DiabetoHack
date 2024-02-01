import React, { useState, useEffect, useCallback } from "react";
import { Text, View, Alert, TouchableOpacity, ActivityIndicator, BackHandler, Image, FlatList, TextInput } from 'react-native';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { NavigationContainer, getFocusedRouteNameFromRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { getAuth } from 'firebase/auth';
import { getDoc, updateDoc, doc, setDoc, onSnapshot, collection, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import CheckBox from 'expo-checkbox';

import { COLORS, FONT, SIZES, icons } from "../constants";

export default function Applications() {

    // Authentication
    const auth = getAuth();
    const userId = auth.currentUser.uid;

    // Applications
    const [applications, setApplications] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());

    
    const fetchApplications = async () => {
        const querySnapshot = await getDocs(collection(db, 'applications'));
        const apps = [];
        querySnapshot.forEach((doc) => {
            apps.push({ id: doc.id, ...doc.data() });
        });
        setApplications(apps);
    };

    fetchApplications();

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSubmit = async () => {
        const promises = [];
        selectedIds.forEach((id) => {
            promises.push(deleteDoc(doc(db, 'applications', id)));
            promises.push(setDoc(doc(db, 'usertype', id), { type: 'writer' }));
        });
        await Promise.all(promises);
        Alert.alert('Approved!', 'Selected applications have been approved.');
        fetchApplications();
    };

    const renderItem = ({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
            <CheckBox value={selectedIds.has(item.id)} onValueChange={() => handleSelect(item.id)} />
            <Text style={{ marginLeft: 10 }}>{item.name} - {item.email}</Text>
        </View>
    );

    return (
        <View>
            <FlatList
                data={applications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
            />
            <TouchableOpacity onPress={handleSubmit} style={{ padding: 10, backgroundColor: 'blue', marginTop: 20 }}>
                <Text style={{ color: 'white', textAlign: 'center' }}>Approve Selected</Text>
            </TouchableOpacity>
        </View>
    );
};