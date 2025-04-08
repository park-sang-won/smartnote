import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

export default function SummaryScreen() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    try {
      if (!inputText.trim()) {
        alert('텍스트를 입력해주세요.');
        return;
      }
      
      setIsLoading(true);
      Keyboard.dismiss();
      
      // 텍스트를 문장 단위로 분리
      const sentences = inputText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // 각 문장의 중요도를 계산 (단어 수, 키워드 포함 여부 등)
      const importantSentences = sentences
        .map(sentence => ({
          text: sentence,
          importance: calculateImportance(sentence)
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, Math.min(3, sentences.length))
        .sort((a, b) => sentences.indexOf(a.text) - sentences.indexOf(b.text))
        .map(s => s.text.trim() + '.');

      const tempSummary = importantSentences.join(' ');
      setSummary(tempSummary);
      
      // 요약 내용을 기반으로 문제 생성
      generateQuestions(tempSummary);
    } catch (error) {
      console.error('요약 중 오류 발생:', error);
      alert('요약 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestions = (summaryText) => {
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

  const calculateImportance = (sentence) => {
    // 문장의 중요도를 계산하는 함수
    const words = sentence.trim().split(/\s+/);
    const wordCount = words.length;
    
    // 키워드 목록 (실제로는 더 많은 키워드를 추가할 수 있습니다)
    const keywords = ['따라서', '그러므로', '결론적으로', '중요한', '핵심', '요약하면'];
    
    // 키워드 포함 여부 확인
    const hasKeywords = keywords.some(keyword => 
      sentence.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 문장 위치에 따른 가중치 (첫 문장과 마지막 문장이 더 중요)
    const positionWeight = 1;
    
    return (wordCount * 0.3) + (hasKeywords ? 2 : 0) + positionWeight;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>📝 AI 요약</Text>
          
          <TextInput
            style={styles.input}
            multiline
            placeholder="요약할 텍스트를 입력하세요..."
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSummarize}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '요약 중...' : '요약하기'}
            </Text>
          </TouchableOpacity>

          {summary ? (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>📌 요약 결과</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}

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
    backgroundColor: '#007AFF',
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
  summaryContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
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
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
