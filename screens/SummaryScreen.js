import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

export default function SummaryScreen({ navigation }) {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

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
      
      // 각 문단의 중요도를 계산 (개선된 알고리즘)
      const importantParagraphs = paragraphs
        .map(paragraph => ({
          text: paragraph,
          importance: calculateImportance(paragraph)
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, Math.min(3, paragraphs.length))
        .sort((a, b) => paragraphs.indexOf(a.text) - paragraphs.indexOf(b.text))
        .map(p => p.text.trim());

      // 문단 내에서 핵심 문장 추출
      const summarySentences = [];
      importantParagraphs.forEach(paragraph => {
        const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const importantSentences = sentences
          .map(sentence => ({
            text: sentence,
            importance: calculateSentenceImportance(sentence)
          }))
          .sort((a, b) => b.importance - a.importance)
          .slice(0, Math.min(2, sentences.length))
          .map(s => s.text.trim() + '.');
        
        summarySentences.push(...importantSentences);
      });

      // 요약 문장들을 자연스럽게 연결
      const tempSummary = connectSentences(summarySentences);
      setSummary(tempSummary);
      setShowQuestions(false);
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
    
    // 확장된 키워드 목록
    const keywords = [
      '따라서', '그러므로', '결론적으로', '중요한', '핵심', '요약하면',
      '특히', '주목할', '결과적으로', '본질적으로', '궁극적으로',
      '결론', '요점', '핵심적', '주요', '중요성', '의미',
      '이유', '원인', '결과', '영향', '효과', '특징',
      '개념', '정의', '설명', '예시', '비교', '대조'
    ];
    
    // 키워드 포함 여부 확인
    const keywordCount = keywords.filter(keyword => 
      paragraph.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    // 문단 길이에 따른 가중치
    const lengthWeight = wordCount > 20 && wordCount < 100 ? 1.5 : 0.5;
    
    // 문장 수에 따른 가중치
    const sentenceCountWeight = sentences.length * 0.3;
    
    // 문단 위치에 따른 가중치 (첫 문단과 마지막 문단이 더 중요)
    const positionWeight = 1.2;
    
    return (wordCount * 0.2) + (keywordCount * 2) + lengthWeight + sentenceCountWeight + positionWeight;
  };

  const calculateSentenceImportance = (sentence) => {
    const words = sentence.trim().split(/\s+/);
    const wordCount = words.length;
    
    // 문장 내 키워드 목록
    const keywords = [
      '따라서', '그러므로', '결론적으로', '중요한', '핵심', '요약하면',
      '특히', '주목할', '결과적으로', '본질적으로', '궁극적으로',
      '결론', '요점', '핵심적', '주요', '중요성', '의미',
      '이유', '원인', '결과', '영향', '효과', '특징',
      '개념', '정의', '설명', '예시', '비교', '대조'
    ];
    
    // 키워드 포함 여부 확인
    const keywordCount = keywords.filter(keyword => 
      sentence.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    // 문장 길이에 따른 가중치
    const lengthWeight = wordCount > 5 && wordCount < 20 ? 1.5 : 0.5;
    
    // 문장 내 특수 문자의 존재 여부
    const hasSpecialChars = /[(),:;]/.test(sentence) ? 0.5 : 0;
    
    return (wordCount * 0.3) + (keywordCount * 2) + lengthWeight + hasSpecialChars;
  };

  const connectSentences = (sentences) => {
    if (sentences.length === 0) return '';
    
    // 문장들을 자연스럽게 연결
    let connectedText = sentences[0];
    
    for (let i = 1; i < sentences.length; i++) {
      const prevSentence = sentences[i - 1];
      const currentSentence = sentences[i];
      
      // 문장 간 연결을 고려하여 조사 추가
      if (prevSentence.endsWith('다.') || prevSentence.endsWith('요.')) {
        connectedText += ' ' + currentSentence;
      } else {
        connectedText += ' 그리고 ' + currentSentence;
      }
    }
    
    return connectedText;
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
