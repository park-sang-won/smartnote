import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, Platform, ScrollView, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function ImageToTextScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState(''); // API 키를 상태로 관리

  useEffect(() => {
    (async () => {
      // 카메라 권한 요청
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      // 미디어 라이브러리 권한 요청
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!cameraPermission.granted || !mediaLibraryPermission.granted) {
        Alert.alert(
          '권한 필요',
          '이 기능을 사용하려면 카메라와 사진첩 접근 권한이 필요합니다.',
          [{ text: '확인' }]
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7, // 이미지 품질을 조정하여 업로드 크기 감소
        base64: true, // base64 형식으로 이미지 데이터 가져오기
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        if (apiKey) {
          processImage(result.assets[0].base64);
        } else {
          Alert.alert(
            'API 키 필요',
            '텍스트 인식을 위해 Google Cloud Vision API 키를 입력해주세요.',
            [{ text: '확인' }]
          );
        }
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        if (apiKey) {
          processImage(result.assets[0].base64);
        } else {
          Alert.alert(
            'API 키 필요',
            '텍스트 인식을 위해 Google Cloud Vision API 키를 입력해주세요.',
            [{ text: '확인' }]
          );
        }
      }
    } catch (error) {
      console.error('카메라 오류:', error);
      Alert.alert('오류', '사진을 촬영하는 중 오류가 발생했습니다.');
    }
  };

  const processImage = async (base64Image) => {
    try {
      setIsProcessing(true);
      setRecognizedText('');

      // Google Cloud Vision API 호출
      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'TEXT_DETECTION'
              }
            ]
          }
        ]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseJson = await response.json();
      
      if (responseJson.responses && responseJson.responses[0] && responseJson.responses[0].fullTextAnnotation) {
        const extractedText = responseJson.responses[0].fullTextAnnotation.text;
        setRecognizedText(extractedText);
      } else {
        if (responseJson.error) {
          Alert.alert('오류', `API 오류: ${responseJson.error.message}`);
        } else {
          Alert.alert('알림', '이미지에서 텍스트를 인식할 수 없습니다.');
        }
      }
    } catch (error) {
      console.error('텍스트 인식 오류:', error);
      Alert.alert('오류', '이미지에서 텍스트를 인식하는 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateQuiz = () => {
    if (!recognizedText.trim()) {
      Alert.alert('알림', '인식된 텍스트가 없습니다. 먼저 이미지를 선택하거나 촬영해주세요.');
      return;
    }

    // 퀴즈 생성 화면으로 이동하고 인식된 텍스트 전달
    navigation.navigate('Quiz', { summary: recognizedText });
  };

  // 테스트용 더미 데이터 로드
  const loadDummyData = () => {
    setRecognizedText(`인공지능(AI)은 인간의 학습능력, 추론능력, 지각능력을 인공적으로 구현한 컴퓨터 시스템이다.
인공지능은 학습, 문제해결, 패턴인식 등과 같은 인간 지능과 관련된 인지 문제를 해결하는 데 중점을 둔다.
딥러닝은 인공지능의 한 분야로, 여러 층의 인공 신경망을 사용하여 데이터로부터 패턴을 학습한다.
자연어 처리는 컴퓨터가 인간의 언어를 이해하고 생성하는 기술이다.
컴퓨터 비전은 컴퓨터가 디지털 이미지나 비디오를 이해하는 방법에 대한 인공지능 분야이다.`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📸 이미지 텍스트 인식</Text>

      <View style={styles.apiKeyContainer}>
        <Text style={styles.apiKeyLabel}>Google Cloud Vision API 키:</Text>
        <TextInput
          style={styles.apiKeyInput}
          placeholder="API 키를 입력하세요"
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry={true}
        />
        <Text style={styles.apiKeyHelp}>
          * API 키가 없는 경우 테스트 데이터 사용 버튼을 눌러 테스트할 수 있습니다.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>📷 촬영하기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>🖼️ 사진첩에서 가져오기</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.testButton} onPress={loadDummyData}>
        <Text style={styles.testButtonText}>🧪 테스트 데이터 사용</Text>
      </TouchableOpacity>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}

      {isProcessing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>텍스트 인식 중...</Text>
        </View>
      )}

      {recognizedText ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>인식된 텍스트:</Text>
          <Text style={styles.resultText}>{recognizedText}</Text>

          <TouchableOpacity style={styles.quizButton} onPress={generateQuiz}>
            <Text style={styles.buttonText}>🎓 퀴즈 생성하기</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  apiKeyContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  apiKeyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  apiKeyHelp: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#333',
    fontSize: 14,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 5,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  quizButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
});
