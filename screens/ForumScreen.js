import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Dimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { NavigationContainer, getFocusedRouteNameFromRoute, useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { db, storage } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';
import { getDoc, updateDoc, doc, setDoc, addDoc, collection, onSnapshot, arrayUnion, DocumentSnapshot, serverTimestamp } from 'firebase/firestore';
import { uploadBytesResumable, ref, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import DraggableGrid from 'react-native-draggable-grid';
import Spinner from 'react-native-loading-spinner-overlay';

import { COLORS, FONT, SIZES, icons } from "../constants";

const ForumScreen = () => {

	// Authentication
	const auth = getAuth();
	const userId = auth.currentUser.uid;

	const [header, setHeader] = useState('');
	const [comment, setComment] = useState('');
	const [image, setImage] = useState([]);
	const [removedImage, setRemovedImage] = useState([]);
	const [imageUri, setImageUri] = useState(null);
	const [userType, setUserType] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const getFirestoreData = () => {
		const docRef = doc(db, 'usertype', userId);
		const unsubscribe = onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const holdData = docSnap.data();
				setUserType(holdData.type || 'user');
			} else {
				console.log('No such document!');
			}
		});

		return () => unsubscribe();
	};

	useFocusEffect(
		useCallback(() => {
			getFirestoreData();
		}, [])
	);

	const handleHeaderChange = (text) => {
		setHeader(text);
	};

	const handleCommentChange = (text) => {
		setComment(text);
	};

	// Images
	const renderItem = (item) => {
		return (
			<View key={item.key} style={styles.item}>
				<Image source={{ uri: item.uri }} style={styles.image} />
				<TouchableOpacity
					onPress={() => removeImage(item.id)}
					style={{
						position: 'absolute',
						right: -5,
						top: -5,
						backgroundColor: '#d9dbda',
						width: 20,
						height: 20,
						borderRadius: 15,
						justifyContent: 'center',
						alignItems: 'center',
						zIndex: 1,
					}}>
					<Image source={icons.cross} style={{ width: 13, height: 13, }}></Image>
				</TouchableOpacity>
			</View>
		);
	};

	const onDragRelease = (newDataOrder) => {
		const newData = newDataOrder.map((item, index) => ({
			...item,
			order: index,
		}));
		setImage(newData);
	};

	const handleImageUpload = async () => {
		if (image.length >= 2) {
			Alert.alert(
				"Invalid Photo Count",
				`Maximum number of pictures uploaded.`,
				[{ text: "OK" }]
			);
			return;
		}
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.2,
		});
		if (!result.canceled) {
			let newImage = {
				key: Math.random().toString(),
				id: Math.random().toString(),
				uri: result.assets[0].uri,
				order: image.length,
				isNew: true,
			};
			setImage(prevImages => [...prevImages, newImage]);
		}
	};

	const removeImage = (id) => {
		const imgIndex = image.findIndex((img) => img.id === id);
		if (imgIndex !== -1) {
			const { uri, isNew } = image[imgIndex];
			if (!isNew) {
				setRemovedImage((oldArray) => [...oldArray, uri]);
			}
			setImage((prevImages) => prevImages.filter((img) => img.id !== id));
		}
	};

	// Image uploading
	const uploadImage = async (uri, order, id) => {
		const response = await fetch(uri);
		const blob = await response.blob();

		const storageRef = ref(storage, `forum_pictures/${userId}/${Date.now()}`);
		const uploadTask = uploadBytesResumable(storageRef, blob);

		return new Promise((resolve, reject) => {
			uploadTask.on(
				"state_changed",
				(snapshot) => {
					const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					console.log(`Upload is ${progress}% done`);
				},
				(error) => {
					console.log(error);
					reject(error);
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
						console.log(`File available at: ${downloadURL}`);
						resolve({ url: downloadURL, id: id });
					});
				}
			);
		});
	};

	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			const userDocRef = doc(db, 'forums', userId);
			const sortedImages = [...image].sort((a, b) => a.order - b.order);
			const imageURLs = [];

			for (let img of sortedImages) {
				if (img.isNew) {
					const uploadResult = await uploadImage(img.uri, img.order, img.id);
					imageURLs.push(uploadResult.url);
				} else {
					imageURLs.push(img.uri);
				}
			}

			let successfullyRemovedImages = [];
			for (let url of removedImage) {
				try {
					const deleteRef = ref(storage, url);
					await deleteObject(deleteRef);
					successfullyRemovedImages.push(url);
				} catch (error) {
					console.error("Error deleting image: ", error);
				}
			};
			setRemovedImage(prevState => prevState.filter(url => !successfullyRemovedImages.includes(url)));

			const forumRef = collection(db, 'forums');
			const newForumPostRef = doc(forumRef);
			await setDoc(newForumPostRef, {
				userId,
				header,
				comment,
				imageURLs,
				createdAt: serverTimestamp(),
			});
			setSubmitting(false);
			setHeader('');
			setComment('');
			setImage([]);
			Alert.alert(
				"Success",
				`Your article has been uploaded.`,
				[{ text: "OK" }]
			);
		} catch (e) {
			setSubmitting(false);
			console.error("Error submitting: ", e);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>

			<View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8 }}>
				<Text style={styles.title}>Write an article</Text>

				<View style={styles.submitButton}>
					<TouchableOpacity onPress={handleSubmit}>
						<Text style={styles.submitButtonText}>Submit</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.inputContainer}>
				<TextInput
					style={styles.input}
					placeholder="Type your header..."
					value={header}
					onChangeText={handleHeaderChange}
				/>
				<TextInput
					style={styles.input}
					placeholder="Type your article..."
					multiline
					value={comment}
					onChangeText={handleCommentChange}
				/>
			</View>

			<TouchableOpacity style={styles.uploadButton} onPress={handleImageUpload}>
				<Text style={styles.uploadButtonText}>Upload Image</Text>
			</TouchableOpacity>

			<DraggableGrid
				numColumns={2}
				data={image}
				renderItem={renderItem}
				disableResorted={true}
				onDragRelease={onDragRelease}
			/>

			<Spinner
				visible={submitting}
				animation='fade'
				overlayColor="rgba(0, 0, 0, 0.25)"
				color="white"
				indicatorStyle={{

				}}
				textContent='Uploading...'
				textStyle={{
					fontFamily: FONT.bold,
					fontSize: SIZES.medium,
					fontWeight: 'normal',
					color: 'white',
				}}
			/>
		</ScrollView>
	);
};

const width = Dimensions.get('window').width;

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	inputContainer: {
		flexDirection: 'column',
		alignItems: 'left',
		marginBottom: 16,
	},
	item: {
		width: width / 2 - 50,
		aspectRatio: 4 / 3,
		bottom: 20
	},
	image: {
		borderRadius: 5,
		borderWidth: 1,
		borderColor: 'gray',
		width: '100%',
		height: '100%',
		resizeMode: 'contain',
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: 'gray',
		borderRadius: 8,
		padding: 8,
	},
	uploadButton: {
		backgroundColor: 'blue',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
	},
	uploadButtonText: {
		color: 'white',
	},
	imageContainer: {
		alignItems: 'center',
		marginBottom: 16,
	},
	submitButton: {
		backgroundColor: 'green',
		borderWidth: 1,
		borderRadius: 8,
		borderColor: 'gray',
		alignItems: 'center',
		justifyContent: 'center',
		width: 60,
		height: 40,
	},
	submitButtonText: {
		color: 'white',
		fontWeight: 'bold',
	},
});

export default ForumScreen;
