import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { doc, updateDoc, arrayUnion, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Switch } from 'react-native-gesture-handler';

const auth = getAuth();

const HomeScreen = () => {
	const [bloodSugarLevel, setBloodSugarLevel] = useState('');
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedTime, setSelectedTime] = useState(new Date());
	const [date, setDate] = useState(new Date());
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
	const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
	const [hasEaten, setHasEaten] = useState(false);
	const [hasInsulin, setHasInsulin] = useState(false);
	const [insulinUnits, setInsulinUnits] = useState('');

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

	const handleSubmit = async () => {
		// Check if both fields are filled
		if (!bloodSugarLevel || !selectedDate || !selectedTime) {
			alert("Please fill up all fields");
			return;
		}
		const docRef = doc(db, 'profiles', userId);
		const combinedDateTime = combineDateTime(selectedDate, selectedTime);
		const timestamp = Timestamp.fromDate(combinedDateTime);
		try {
			const docSnap = await getDoc(docRef);
			let hasEatenArray = [];
			let hasInsulinArray = [];
			if (docSnap.exists()) {
				const data = docSnap.data();
				hasEatenArray = data.hasEaten || [];
				hasInsulinArray = data.hasInsulin || [];
			}
			hasEatenArray.push(hasEaten);
			hasInsulinArray.push(hasInsulin);
			await updateDoc(docRef, {
				bloodSugarLevels: arrayUnion(parseFloat(bloodSugarLevel)),
				times: arrayUnion(timestamp),
				hasEaten: hasEatenArray,
				hasInsulin: hasInsulinArray,
				insulinUnits: arrayUnion(hasInsulin ? parseFloat(insulinUnits) : null),
			});
			console.log('Data successfully added to Firestore');
			setBloodSugarLevel('');
			setSelectedDate(new Date());
			setHasEaten(false);
			setHasInsulin(false);
			setInsulinUnits('');
		} catch (error) {
			console.error('Error adding data to Firestore:', error);
		}
	};

	const handleSwitchChange = (value) => {
		setHasEaten(value);
	};

	const handleSwitchChange2 = (value) => {
		setHasInsulin(value);
	};

	const showDatePicker = () => {
		setDatePickerVisibility(true);
	};

	const showTimePicker = () => {
		setTimePickerVisibility(true);
	};

	const hideDatePicker = () => {
		setDatePickerVisibility(false);
	};

	const hideTimePicker = () => {
		setTimePickerVisibility(false);
	};

	const handleDateChange = (event, selectedDate) => {
		const currentDate = selectedDate || date;
		setSelectedDate(currentDate);
		setDatePickerVisibility(false);
	};

	const handleTimeChange = (event, selectedTime) => {
		const currentTime = selectedTime || time;
		setSelectedTime(currentTime);
		setTimePickerVisibility(false);
	};

	const combineDateTime = (date, time) => {
		let combined = new Date(date);
		combined.setHours(time.getHours());
		combined.setMinutes(time.getMinutes());
		return combined;
	};

	return (
		<KeyboardAwareScrollView>
			<View style={styles.container}>
				<Text style={styles.title}>Record Blood Sugar Level</Text>
				<TextInput
					style={styles.input}
					placeholder="Blood Sugar Level (mg/dL)"
					keyboardType="numeric"
					value={bloodSugarLevel}
					onChangeText={(text) => setBloodSugarLevel(text)}
				/>
				<View style={styles.buttonContainer}>
					<Button title="Select Date" onPress={showDatePicker} />
					{isDatePickerVisible && (
						<DateTimePicker
							id="datePicker"
							value={selectedDate}
							mode="date"
							display="default"
							onChange={handleDateChange}
							maximumDate={new Date()}
						/>
					)}
					<Button title="Select Time" onPress={showTimePicker} />
					{isTimePickerVisible && (
						<DateTimePicker
							id="timePicker"
							value={selectedTime}
							mode="time"
							display='default'
							onChange={handleTimeChange}
						/>
					)}
					<View style={styles.switchContainer}>
						<Text style={styles.switchLabel}>Consumed food? </Text>
						<Switch
							title="Consumed food?"
							trackColor={{ false: "#767577", true: "#81b0ff" }}
							thumbColor={hasEaten ? "#81b0ff" : "#f4f3f4"}
							ios_backgroundColor="#3e3e3e"
							onValueChange={handleSwitchChange}
							value={hasEaten}
						/>
						<Text style={styles.switchText}>{hasEaten ? 'Yes' : 'No'}</Text>
					</View>
					<View style={styles.switchContainer}>
						<Text style={styles.switchLabel}>Took Your Insulin? </Text>
						<Switch
							title="Took Insulin?"
							trackColor={{ false: "#767577", true: "#81b0ff" }}
							thumbColor={hasInsulin ? "#81b0ff" : "#f4f3f4"}
							ios_backgroundColor="#3e3e3e"
							onValueChange={handleSwitchChange2}
							value={hasInsulin}
						/>
						<Text style={styles.switchText}>{hasInsulin ? 'Yes' : 'No'}</Text>
					</View>
					<Text></Text>
					{hasInsulin && (
						<TextInput
							style={styles.insulininput}
							placeholder="If yes, How many units"
							keyboardType="numeric"
							value={insulinUnits}
							onChangeText={(text) => setInsulinUnits(text)}
						/>
					)}
					<Button title="Submit" onPress={handleSubmit} />
				</View>
			</View>
		</KeyboardAwareScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	input: {
		fontSize: 24,
		width: '100%',
		height: 60,
		borderWidth: 1,
		borderColor: 'gray',
		marginBottom: 20,
		paddingHorizontal: 10,
	},
	insulininput: {
		width: '100%',
		height: 60,
		fontSize: 24,
		borderWidth: 1,
		borderColor: 'gray',
		paddingHorizontal: 10,
	},
	buttonContainer: {
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	switchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
	},
	switchLabel: {
		marginRight: 10,
		fontSize: 20,
	},
	switchText: {
		marginLeft: 10,
	},
});

export default HomeScreen;
