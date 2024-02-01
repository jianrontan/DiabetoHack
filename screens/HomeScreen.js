import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDoc, setDoc, doc } from '@firebase/firestore';
import { LineChart } from 'react-native-chart-kit';
import { getAuth } from 'firebase/auth';
import { db, auth } from '../firebase/firebase';

const HomeScreen = () => {
  const auth = getAuth();
  const userId = auth.currentUser.uid;

  const createUserDocument = async () => {
    const userDocRef = doc(db, "usertype", userId);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, { type: "user" });
      console.log("Document usertype created");
    } else {
      console.log("Document usertype already exists");
    }
  };

  const createStorageDocument = async () => {
    const userDocRef = doc(db, "forums", userId);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, { header: null });
      console.log("Document forums created");
    } else {
      console.log("Document forums already exists");
    }
  };

  useEffect(() => {
    createUserDocument();
    createStorageDocument();
  }, []);

  const [glucoseLevel, setGlucoseLevel] = useState('');
  const [timeOfDay, setTimeOfDay] = useState(new Date());
  const [show, setShow] = useState(false);
  const [data, setData] = useState({
    labels: ['1', '2', '3', '4', '5', '6'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
      },
    ],
  });

  const handleAddData = () => {
    // Add the new data to the datasets array
    // You need to implement data storage and retrieval here
    // For demo purposes, we're just updating the state directly
    setData({
      labels: [...data.labels, '7'],
      datasets: [
        {
          data: [...data.datasets[0].data, parseInt(glucoseLevel)],
        },
      ],
    });
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || timeOfDay;
    setTimeOfDay(currentDate);
    setShow(false);
  };

  return (
    <View>
      <Text>Blood Glucose Level:</Text>
      <TextInput
        value={glucoseLevel}
        onChangeText={setGlucoseLevel}
        keyboardType="numeric"
      />
      <Text>Time of the Day:</Text>
      <Button title="Select Time" onPress={() => setShow(true)} />
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={timeOfDay}
          mode="time"
          display="default"
          onChange={onChange}
        />
      )}
      <Button title="Add Data" onPress={handleAddData} />
      <LineChart
        data={data}
        width={300}
        height={200}
        yAxisLabel="Blood Glucose"
        verticalLabelRotation={30}
        chartConfig={{
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
        }}
        bezier
      />
    </View>
  );
};

export default HomeScreen;