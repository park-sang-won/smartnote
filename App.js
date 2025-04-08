import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainMenu from './screens/MainMenu';
import NoteScreen from './screens/NoteScreen';
import ImageToTextScreen from './screens/ImageToTextScreen';
import SpeechScreen from './screens/SpeechScreen';
import SummaryScreen from './screens/SummaryScreen';
import QuizScreen from './screens/QuizScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainMenu">
        <Stack.Screen name="MainMenu" component={MainMenu} options={{ title: '스마트 노트' }} />
        <Stack.Screen name="Note" component={NoteScreen} options={{ title: '노트 작성' }} />
        <Stack.Screen name="ImageToText" component={ImageToTextScreen} options={{ title: '이미지 텍스트 인식' }} />
        <Stack.Screen name="Speech" component={SpeechScreen} options={{ title: '음성 인식' }} />
        <Stack.Screen name="Summary" component={SummaryScreen} options={{ title: 'AI 요약' }} />
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: '시험 문제 생성' }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
