import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryZoomContainer, VictoryAxis } from 'victory-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const auth = getAuth();

const GraphScreen = () => {
  const [groupedData, setGroupedData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("day");

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
  }

  let date = new Date();
  console.log(getWeekNumber(date));

  const fetchData = async () => {
    const userUid = auth.currentUser.uid;
    const docRef = doc(db, 'profiles', userUid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const bloodSugarLevels = userData?.bloodSugarLevels || [];
      const timestamps = userData?.times || [];

      if (selectedFilter === "day") {
        const today = new Date();
        const todayTimestamps = timestamps.filter(timestamp => {
          const date = timestamp.toDate();
          return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
          );
        });

        const todayBloodSugarLevels = todayTimestamps.map((timestamp, index) => bloodSugarLevels[index]);

        const dataPoints = todayTimestamps.map((timestamp, index) => {
          const date = timestamp.toDate();
          const hour = date.getHours();
          const bloodGlucoseLevel = todayBloodSugarLevels[index];

          console.log('Timestamp:', timestamp, 'Blood Glucose Level:', bloodGlucoseLevel);

          return { x: hour, y: bloodGlucoseLevel };
        });

        setGroupedData(dataPoints);
      } else if (selectedFilter === "week") {
        const today = new Date();
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1); // Start of the current week (Monday)
        const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7); // End of the current week (Sunday)

        const thisWeekTimestamps = timestamps.filter(timestamp => {
          const date = timestamp.toDate();
          return date >= startOfWeek && date <= endOfWeek;
        });

        const thisWeekBloodSugarLevels = thisWeekTimestamps.map((timestamp, index) => bloodSugarLevels[index]);

        const dataPoints = thisWeekTimestamps.map((timestamp, index) => {
          const date = timestamp.toDate();
          const dayOfWeek = date.getDay();
          const bloodGlucoseLevel = thisWeekBloodSugarLevels[index];

          console.log('Timestamp:', timestamp, 'Blood Glucose Level:', bloodGlucoseLevel);

          return { x: dayOfWeek === 0 ? 7 : dayOfWeek, y: bloodGlucoseLevel };
        });

        setGroupedData(dataPoints);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [selectedFilter])
  );

  const renderGraph = () => {
    if (selectedFilter === "day") {
      return (
        <VictoryChart
          containerComponent={<VictoryZoomContainer />}
          domain={{ y: [0, 25], x: [0, 24] }}
          style={styles.graph}
        >
          {groupedData.length > 0 && <VictoryLine data={groupedData} x="x" y="y" />}
          <VictoryAxis
            label="Hours"
            style={{
              axisLabel: { padding: 30 }
            }}
            tickFormat={(x) => {
              const hours = ((x % 24) + 24) % 24;
              const period = hours >= 12 ? 'pm' : 'am';
              const formattedHours = hours % 12 || 12;
              return `${formattedHours} ${period}`;
            }}
          />
          <VictoryAxis
            dependentAxis
            label="Blood Glucose Levels"
            style={{
              axisLabel: { padding: 30 }
            }}
          />
        </VictoryChart>
      );
    } else if (selectedFilter === "week") {
      return (
        <VictoryChart
          containerComponent={<VictoryZoomContainer />}
          domain={{ y: [0, 25], x: [1, 7] }}
          style={styles.graph}
        >
          {groupedData.length > 0 && <VictoryLine data={groupedData} x="x" y="y" />}
          <VictoryAxis
            label="Day"
            tickFormat={(x) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][x - 1]}
            style={{
              axisLabel: { padding: 30 }
            }}
          />
          <VictoryAxis
            dependentAxis
            label="Blood Glucose Levels"
            style={{
              axisLabel: { padding: 30 }
            }}
          />
        </VictoryChart>
      );
    } else if (selectedFilter === "month") {
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(); // Get number of days in current month
      return (
        <VictoryChart
          containerComponent={<VictoryZoomContainer />}
          domain={{ y: [0, 25], x: [1, daysInMonth] }}
          style={styles.graph}
        >
          {groupedData.length > 0 && <VictoryLine data={groupedData} x="x" y="y" />}
          <VictoryAxis
            label="Days in a Month"
            style={{
              axisLabel: { padding: 30 }
            }}
          />
          <VictoryAxis
            dependentAxis
            label="Blood Glucose Levels"
            style={{
              axisLabel: { padding: 30 }
            }}
          />
        </VictoryChart>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedFilter}
        onValueChange={(itemValue) => {
          setSelectedFilter(itemValue);
        }}
      >
        <Picker.Item label="Today" value="day" />
        <Picker.Item label="This Week" value="week" />
        <Picker.Item label="This Month" value="month" />
      </Picker>
      {renderGraph()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  graph: {
    width: width,
    height: height,
  },
});

export default GraphScreen;