import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';

const History = () => {
    const [bloodGlucoseData, setBloodGlucoseData] = useState([]);
    useFocusEffect(
        React.useCallback(() => {
            let isCancelled = false;

            const fetchData = async () => {
                try {
                    const auth = getAuth();
                    const userId = auth.currentUser.uid;
                    const db = getFirestore();

                    const userDocRef = doc(db, 'profiles', userId);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        if (userData && userData.bloodSugarLevels) {
                            setBloodGlucoseData(userData);
                        }
                    } else {
                        console.log('User document not found.');
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            };

            fetchData();

            return () => {
                isCancelled = true;
            };
        }, [])
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View>
                <Text style={styles.sectionTitle}>Blood Glucose History</Text>
                {bloodGlucoseData.bloodSugarLevels && bloodGlucoseData.bloodSugarLevels.map((level, index) => (
                    <View key={index} style={styles.box}>
                        <Text>{`Blood Glucose Level: ${level}`}</Text>
                        <Text>{`Time: ${new Date(bloodGlucoseData.times[index].toDate()).toLocaleString()}`}</Text>
                        <Text>{bloodGlucoseData.hasEaten && bloodGlucoseData.hasEaten[index] ? 'Consumed food' : 'Did not consume food'}</Text>
                        <Text>{bloodGlucoseData.hasInsulin && bloodGlucoseData.hasInsulin[index] ? `Injected Insulin: ${bloodGlucoseData.insulinUnits[index]} units` : 'Did not inject insulin'}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    box: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
});

export default History;