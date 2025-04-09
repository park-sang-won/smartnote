import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

export default function SummaryScreen({ navigation }) {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    try {
      if (!inputText.trim()) {
        alert('텍스트를 입력해주세요.');
        return;
      }
      
      setIsLoading(true);
      Keyboard.dismiss();
      
      // 텍스트를 문단 단위로 분리
      const paragraphs = inputText.split('\n').filter(p => p.trim().length > 0);
      
      // 각 문단의 중요도를 계산
      const importantParagraphs = paragraphs
        .map(paragraph => ({
          text: paragraph,
          importance: calculateImportance(paragraph)
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, Math.min(3, paragraphs.length))
        .sort((a, b) => paragraphs.indexOf(a.text) - paragraphs.indexOf(b.text))
        .map(p => p.text.trim());

      // 핵심 문장 추출
      const sentences = inputText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const keySentences = sentences
        .map(sentence => ({
          text: sentence,
          importance: calculateSentenceImportance(sentence)
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, Math.min(5, sentences.length))
        .sort((a, b) => sentences.indexOf(a.text) - sentences.indexOf(b.text))
        .map(s => s.text.trim() + '.');

      // 요약 생성
      const tempSummary = [...importantParagraphs, ...keySentences].join('\n\n');
      setSummary(tempSummary);
    } catch (error) {
      console.error('요약 중 오류 발생:', error);
      alert('요약 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateImportance = (paragraph) => {
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const wordCount = paragraph.split(/\s+/).length;
    
    // 키워드 목록
    const keywords = [
      '따라서', '그러므로', '결론적으로', '중요한', '핵심', '요약하면',
      '결론', '요점', '주요', '특징', '장점', '단점', '의미', '영향'
    ];
    
    // 키워드 포함 여부 확인
    const hasKeywords = keywords.some(keyword => 
      paragraph.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 문단 위치에 따른 가중치
    const positionWeight = 1;
    
    return (wordCount * 0.3) + (hasKeywords ? 2 : 0) + positionWeight + (sentences.length * 0.5);
  };

  const calculateSentenceImportance = (sentence) => {
    const words = sentence.trim().split(/\s+/);
    const wordCount = words.length;
    
    // 키워드 목록
    const keywords = [
      '따라서', '그러므로', '결론적으로', '중요한', '핵심', '요약하면',
      '결론', '요점', '주요', '특징', '장점', '단점', '의미', '영향'
    ];
    
    // 키워드 포함 여부 확인
    const hasKeywords = keywords.some(keyword => 
      sentence.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 문장 위치에 따른 가중치
    const positionWeight = 1;
    
    // 특수 문장 부호 포함 여부
    const hasSpecialChars = /[;:()]/.test(sentence);
    
    return (wordCount * 0.3) + (hasKeywords ? 2 : 0) + positionWeight + (hasSpecialChars ? 1 : 0);
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
              
              <TouchableOpacity 
                style={[styles.button, styles.generateButton]} 
                onPress={() => navigation.navigate('Quiz', { summary })}
              >
                <Text style={styles.buttonText}>문제 생성하기</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#10B981',
  },
});
