import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QuizScreen({ route }) {
  const [inputText, setInputText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSavedQuizzes();
    if (route.params?.summary) {
      generateQuestions(route.params.summary);
    }
  }, [route.params?.summary]);

  const loadSavedQuizzes = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedQuizzes');
      if (saved) {
        setSavedQuizzes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('저장된 퀴즈 로드 중 오류:', error);
    }
  };

  const saveQuiz = async (quiz) => {
    try {
      const newQuizzes = [...savedQuizzes, quiz];
      await AsyncStorage.setItem('savedQuizzes', JSON.stringify(newQuizzes));
      setSavedQuizzes(newQuizzes);
      Alert.alert('성공', '퀴즈가 저장되었습니다.');
    } catch (error) {
      console.error('퀴즈 저장 중 오류:', error);
      Alert.alert('오류', '퀴즈 저장 중 오류가 발생했습니다.');
    }
  };

  const generateQuestions = (summaryText) => {
    try {
      setIsLoading(true);
      
      const sentences = summaryText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const generatedQuestions = [];

      // 각 문장에서 핵심 단어를 추출하여 문제 생성
      sentences.forEach((sentence, index) => {
        const words = sentence.trim().split(/\s+/);
        const keyWords = words.filter(word => 
          word.length > 2 && 
          !['이', '가', '을', '를', '은', '는', '의', '에', '에서', '으로', '와', '과'].includes(word)
        );

        if (keyWords.length > 0) {
          const question = {
            id: index,
            question: `${sentence.replace(keyWords[0], '_____')}`,
            answer: keyWords[0],
            options: generateOptions(keyWords[0], words)
          };
          generatedQuestions.push(question);
        }
      });

      // 문제가 5개 미만이면 추가 문제 생성
      while (generatedQuestions.length < 5 && generatedQuestions.length < sentences.length) {
        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
        const words = randomSentence.trim().split(/\s+/);
        const keyWords = words.filter(word => 
          word.length > 2 && 
          !['이', '가', '을', '를', '은', '는', '의', '에', '에서', '으로', '와', '과'].includes(word)
        );

        if (keyWords.length > 0) {
          const question = {
            id: generatedQuestions.length,
            question: `${randomSentence.replace(keyWords[0], '_____')}`,
            answer: keyWords[0],
            options: generateOptions(keyWords[0], words)
          };
          generatedQuestions.push(question);
        }
      }

      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('문제 생성 중 오류 발생:', error);
      Alert.alert('오류', '문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateOptions = (correctAnswer, words) => {
    const options = [correctAnswer];
    const similarWords = words.filter(word => 
      word.length > 2 && 
      word !== correctAnswer &&
      !['이', '가', '을', '를', '은', '는', '의', '에', '에서', '으로', '와', '과'].includes(word)
    );

    while (options.length < 4 && similarWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * similarWords.length);
      if (!options.includes(similarWords[randomIndex])) {
        options.push(similarWords[randomIndex]);
      }
      similarWords.splice(randomIndex, 1);
    }

    // 옵션 섞기
    return options.sort(() => Math.random() - 0.5);
  };

  const loadSavedQuestions = async () => {
    try {
      setIsLoading(true);
      const questions = await AsyncStorage.getItem('savedQuestions');
      console.log('Loaded questions from storage:', questions);
      
      if (questions) {
        try {
          const parsedQuestions = JSON.parse(questions);
          console.log('Successfully parsed questions:', parsedQuestions);
          setSavedQuestions(parsedQuestions);
        } catch (e) {
          console.error('Error parsing saved questions:', e);
          setSavedQuestions([]);
        }
      } else {
        console.log('No saved questions found in storage');
        setSavedQuestions([]);
      }
    } catch (error) {
      console.error('Error loading saved questions:', error);
      alert('저장된 문제를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>📝 시험 문제 생성</Text>
          
          <TextInput
            style={styles.input}
            multiline
            placeholder="문제를 생성할 텍스트를 입력하세요..."
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={() => generateQuestions(inputText)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '문제 생성 중...' : '문제 생성하기'}
            </Text>
          </TouchableOpacity>

          {questions.length > 0 && (
            <View style={styles.questionsContainer}>
              <Text style={styles.questionsTitle}>📝 생성된 문제</Text>
              {questions.map((q, index) => (
                <View key={q.id} style={styles.questionItem}>
                  <Text style={styles.questionText}>
                    {index + 1}. {q.question}
                  </Text>
                  <View style={styles.optionsContainer}>
                    {q.options.map((option, optIndex) => (
                      <Text key={optIndex} style={styles.optionText}>
                        {String.fromCharCode(65 + optIndex)}. {option}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.answerText}>
                    정답: {q.answer}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionsContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  questionItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  questionText: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
  },
  optionsContainer: {
    marginLeft: 20,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  answerText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
});
