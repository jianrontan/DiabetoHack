import React, { useState, useEffect, useCallback } from "react";
import { Text, View, Alert, TouchableOpacity, Image, FlatList, TextInput, SafeAreaView } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getDoc, doc, setDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';

import { FONT } from "../constants";

export default function ForumScreen() {

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
                const holdData = docSnap.data();
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
        <SafeAreaView style={{ flex: 1 }}>
            <View contentContainerStyle={{ flexGrow: 1 }}>
                <View>
                    <FlatList
                        data={forums}
                        removeClippedSubviews={false}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        style={{
                            
                        }}
                        renderItem={({ item }) => (
                            <View style={{ padding: 10 }}>
                                <Text style={{ fontFamily: FONT.bold, flexWrap: 'wrap' }}>{item.header}</Text>
                                <Text style={{ fontFamily: FONT.medium, flexWrap: 'wrap' }}>{item.comment}</Text>
                                {item.imageURLs && item.imageURLs.map((url, index) => (
                                    <Image key={index} source={{ uri: url }} style={{ width: 320, height: 240, resizeMode: 'contain', alignSelf: 'center', top: 10 }} />
                                ))}
                            </View>
                        )}
                        ListFooterComponent={
                            <>
                            { type === 'user' || type === 'admin' ? (
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
                                    <View style={{ padding: 2 }}></View>
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
                            </>
                        }
                    />
                </View>
            </View>
        </SafeAreaView>
    )
};