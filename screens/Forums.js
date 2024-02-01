import React, { useState, useEffect, useCallback } from "react";
import { Text, View, Alert, TouchableOpacity, ActivityIndicator, BackHandler, Image, FlatList, TextInput } from 'react-native';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { NavigationContainer, getFocusedRouteNameFromRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { getAuth } from 'firebase/auth';
import { getDoc, updateDoc, doc, setDoc, onSnapshot, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';

import { COLORS, FONT, SIZES, icons } from "../constants";

export default function Forums() {

    // TODO: ADD IN KEYBOARD SPACER / FIX KEYBOARD

    // Authentication
    const auth = getAuth();
    const userId = auth.currentUser.uid;

    // Forums
    const [forums, setForums] = useState([]);

    // Details
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // User type
    const [type, setType] = useState("user");

    async function fetchUserType() {
        const auth = getAuth();
        const userId = auth.currentUser.uid;
        const userTypeRef = doc(db, 'usertype', userId);

        try {
            const docSnap = await getDoc(userTypeRef);
            if (docSnap.exists()) {
                const holdData = docSnap.data(); // Return the user's type
                setType(holdData.type || "user");
            } else {
                console.log('No such document!');
            };
        } catch (error) {
            console.error('Error fetching user type:', error);
        };
    };

    useEffect(() => {
        fetchUserType();
    }, [])

    // Data
    useEffect(() => {
        const forumsRef = collection(db, 'forums');
        const q = query(forumsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const forumsArray = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setForums(forumsArray);
        });

        return () => unsubscribe();
    }, []);

    // Email Validation
    const isEmailValid = (email) => {
        const pattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
        return pattern.test(email);
    };

    const handleSubmit = async () => {
        if (!isEmailValid(email)) {
            Alert.alert(
                "Invalid Email",
                `Please enter a valid email.`,
                [{ text: "OK" }]
            );
        } else {
            const userDocRef = doc(db, 'applications', userId);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    Alert.alert(
                        "Alert",
                        `Please wait for your application to be reviewed.`,
                        [{ text: "OK" }]
                    );
                    return;
                } else {
                    await setDoc(userDocRef, { name: name, email: email });
                    setName('');
                    setEmail('');
                    Alert.alert(
                        "Success",
                        `Your application will be sent for review.`,
                        [{ text: "OK" }]
                    );
                };
            } catch (e) {
                console.error("Error submitting: ", e);
            };
        };
    };

    return (
        <View>
            <FlatList
                data={forums}
                removeClippedSubviews={false}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.header}</Text>
                        <Text>{item.comment}</Text>
                        {item.imageURLs && item.imageURLs.map((url, index) => (
                            <Image key={index} source={{ uri: url }} style={{ width: 100, height: 75 }} />
                        ))}
                    </View>
                )}
            />
            {type === 'user' || type === 'admin' ? (
                <View>
                    <Text>Apply to be a writer here:</Text>
                    <View style={{ borderWidth: 1 }}>
                        <TextInput
                            placeholder="Enter your name and designation"
                            autoFocus={false}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                    <View style ={{padding: 2}}></View>
                    <View style={{ borderWidth: 1 }}>
                        <TextInput
                            placeholder="Enter your email address"
                            autoFocus={false}
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                    <TouchableOpacity onPress={handleSubmit}>
                        <Text>Submit</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    )
};