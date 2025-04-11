import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QuizScreen({ route }) {
  const [inputText, setInputText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);

  useEffect(() => {
    loadSavedQuizzes();
    if (route.params?.summary) {
      generateQuestions(route.params.summary);
    }
  }, [route.params?.summary]);

  useEffect(() => {
    // 모든 문제가 답변되었는지 확인
    const answered = Object.keys(selectedAnswers).length === questions.length;
    setAllQuestionsAnswered(answered);
  }, [selectedAnswers, questions]);

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

  const generateQuestions = async (text) => {
    try {
      setIsLoading(true);
      
      // 텍스트를 문장 단위로 분리
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // 핵심 단어 추출을 위한 함수
      const extractKeyWords = (sentence) => {
        const words = sentence.trim().split(/\s+/);
        return words.filter(word => 
          word.length > 2 && 
          !['이', '가', '을', '를', '은', '는', '의', '에', '에서', '으로', '와', '과'].includes(word)
        );
      };

      const generatedQuestions = [];

      // 각 문장에서 핵심 개념을 추출하여 문제 생성
      for (const sentence of sentences) {
        const keyWords = extractKeyWords(sentence);
        if (keyWords.length > 0) {
          const question = {
            id: generatedQuestions.length,
            question: generateQuestionText(sentence, keyWords[0]),
            answer: keyWords[0],
            options: generateOptions(keyWords[0], keyWords)
          };
          generatedQuestions.push(question);
        }
      }

      // 문제가 5개 미만이면 추가 문제 생성
      while (generatedQuestions.length < 5 && generatedQuestions.length < sentences.length) {
        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
        const keyWords = extractKeyWords(randomSentence);
        
        if (keyWords.length > 0) {
          const question = {
            id: generatedQuestions.length,
            question: generateQuestionText(randomSentence, keyWords[0]),
            answer: keyWords[0],
            options: generateOptions(keyWords[0], keyWords)
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

  const generateQuestionText = (sentence, keyWord) => {
    const questionTypes = [
      `다음 설명에 해당하는 개념은? "${sentence}"`,
      `"${sentence}" 이 설명하는 개념은?`,
      `다음 설명이 나타내는 핵심 개념은? "${sentence}"`,
      `다음 설명에서 가장 중요한 개념은? "${sentence}"`,
      `다음 설명의 주제는? "${sentence}"`
    ];
    return questionTypes[Math.floor(Math.random() * questionTypes.length)];
  };

  const generateOptions = (correctAnswer, keyWords) => {
    const options = [correctAnswer];
    const similarWords = keyWords.filter(word => 
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

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };

  const calculateScore = () => {
    let score = 0;
    Object.entries(selectedAnswers).forEach(([questionIndex, answerIndex]) => {
      if (questions[questionIndex].answer === questions[questionIndex].options[answerIndex]) {
        score++;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    if (allQuestionsAnswered) {
      setShowResults(true);
    } else {
      Alert.alert('알림', '모든 문제에 답변해주세요.');
    }
  };

  const renderQuestion = (question, index) => (
    <View key={index} style={styles.questionContainer}>
      <Text style={styles.questionText}>{`${index + 1}. ${question.question}`}</Text>
      {question.options.map((option, optionIndex) => (
        <TouchableOpacity
          key={optionIndex}
          style={[
            styles.optionButton,
            selectedAnswers[index] === optionIndex && styles.selectedOption
          ]}
          onPress={() => handleAnswerSelect(index, optionIndex)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderResults = () => {
    const score = calculateScore();
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>퀴즈 결과</Text>
        <Text style={styles.scoreText}>{`점수: ${score}/${questions.length}`}</Text>
        {questions.map((question, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.questionText}>{`${index + 1}. ${question.question}`}</Text>
            <Text style={[
              styles.answerText,
              question.options[selectedAnswers[index]] === question.answer ? 
              styles.correctAnswer : styles.wrongAnswer
            ]}>
              {`당신의 답: ${question.options[selectedAnswers[index]]}`}
            </Text>
            <Text style={styles.correctAnswerText}>
              {`정답: ${question.answer}`}
            </Text>
          </View>
        ))}
      </View>
    );
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
            onPress={() => {
              setShowResults(false);
              setSelectedAnswers({});
              generateQuestions(inputText);
            }}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '문제 생성 중...' : '문제 생성하기'}
            </Text>
          </TouchableOpacity>

          {questions.length > 0 && (
            <View style={styles.questionsContainer}>
              <Text style={styles.questionsTitle}>📝 생성된 문제</Text>
              {!showResults ? (
                <>
                  {questions.map((question, index) => renderQuestion(question, index))}
                  <TouchableOpacity
                    style={[styles.submitButton, !allQuestionsAnswered && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!allQuestionsAnswered}
                  >
                    <Text style={styles.submitButtonText}>
                      {allQuestionsAnswered ? '제출하기' : '모든 문제에 답변해주세요'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                renderResults()
              )}
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
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionButton: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: '#d0d0d0',
  },
  optionText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  resultsContainer: {
    padding: 20,
  },
  resultsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  resultItem: {
    marginBottom: 20,
  },
  answerText: {
    fontSize: 16,
    marginTop: 5,
  },
  correctAnswer: {
    color: 'green',
  },
  wrongAnswer: {
    color: 'red',
  },
  correctAnswerText: {
    fontSize: 16,
    color: 'green',
    marginTop: 5,
  },
});
