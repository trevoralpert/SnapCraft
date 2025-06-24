import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { ragService, RAGQuery, EnhancedRAGResponse } from '../../services/rag';
import { useNotifications } from '../../shared/components/NotificationSystem';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  ragResponse?: EnhancedRAGResponse;
  isLoading?: boolean;
}

const QUICK_QUESTIONS = [
  {
    question: "What tools do I need to start woodworking?",
    craftType: "woodworking"
  },
  {
    question: "How do I prepare clay for pottery?",
    craftType: "pottery"
  },
  {
    question: "What are the basics of blacksmithing safety?",
    craftType: "blacksmithing"
  },
  {
    question: "Suggest a beginner woodworking project",
    craftType: "woodworking"
  }
];

export default function AIAssistantScreen() {
  const { user } = useAuthStore();
  const { showError, showSuccess } = useNotifications();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: `Hello! I'm your AI craft assistant. I can help you with techniques, project ideas, tool recommendations, and troubleshooting. 

My knowledge spans traditional and modern crafts including woodworking, metalworking, pottery, and more. What would you like to learn about today?`,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async (messageText: string, craftType?: string) => {
    if (!messageText.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    // Add loading assistant message
    const loadingMessage: ChatMessage = {
      id: `assistant_${Date.now()}`,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Build RAG query
      const ragQuery: RAGQuery = {
        query: messageText.trim(),
        context: {
          includeUserProfile: true,
          craftTypes: craftType ? [craftType] : undefined,
        },
        options: {
          maxKnowledgeResults: 3,
          includeFollowUp: true,
        }
      };

      // Process with RAG service
      const ragResponse = await ragService.processQuery(ragQuery);

      // Update loading message with response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? {
              ...msg,
              content: ragResponse.content,
              ragResponse,
              isLoading: false,
            }
          : msg
      ));

      showSuccess('Response Generated', `AI assistant responded in ${ragResponse.processingTime}ms`);

    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      // Update loading message with error
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? {
              ...msg,
              content: "I'm sorry, I'm having trouble processing your request right now. Please try again later or rephrase your question.",
              isLoading: false,
            }
          : msg
      ));

      showError('AI Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string, craftType: string) => {
    sendMessage(question, craftType);
  };

  const clearChat = () => {
    const welcomeMessage = messages.find(msg => msg.id === 'welcome');
    setMessages(welcomeMessage ? [welcomeMessage] : []); // Keep welcome message
    showSuccess('Chat Cleared', 'Conversation history has been reset');
  };

  const renderMessage = (message: ChatMessage) => {
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.assistantMessage
      ]}>
        <View style={styles.messageHeader}>
          <View style={styles.messageIcon}>
            <Ionicons 
              name={message.type === 'user' ? 'person' : 'sparkles'} 
              size={16} 
              color={message.type === 'user' ? '#8B4513' : '#4CAF50'} 
            />
          </View>
          <Text style={styles.messageType}>
            {message.type === 'user' ? 'You' : 'AI Assistant'}
          </Text>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {message.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        ) : (
          <Text style={styles.messageContent}>{message.content}</Text>
        )}

        {/* Show RAG metadata for assistant messages */}
        {message.ragResponse && (
          <View style={styles.ragMetadata}>
            <View style={styles.ragStats}>
              <Text style={styles.ragStatsText}>
                ⚡ {message.ragResponse.processingTime}ms • 
                📚 {message.ragResponse.knowledgeBase.length} sources • 
                🎯 {message.ragResponse.confidence}% confidence
              </Text>
            </View>
            
            {message.ragResponse.suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>💡 Suggestions:</Text>
                {message.ragResponse.suggestions.slice(0, 3).map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => sendMessage(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequiredContainer}>
          <Ionicons name="sparkles" size={48} color="#8B4513" />
          <Text style={styles.authRequiredTitle}>AI Assistant</Text>
          <Text style={styles.authRequiredText}>
            Please log in to access the AI craft assistant and get personalized guidance.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={24} color="#4CAF50" />
          <Text style={styles.headerTitle}>AI Craft Assistant</Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="refresh" size={20} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <View style={styles.quickQuestionsContainer}>
          <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QUICK_QUESTIONS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(item.question, item.craftType)}
              >
                <Text style={styles.quickQuestionText}>{item.question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me about crafts, techniques, tools..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginLeft: 8,
  },
  clearButton: {
    padding: 8,
  },
  quickQuestionsContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  quickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  quickQuestionButton: {
    backgroundColor: '#F9F5F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 20,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  quickQuestionText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  messageContainer: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
  },
  messageContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  ragMetadata: {
    marginTop: 8,
  },
  ragStats: {
    backgroundColor: '#F0F8F0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  ragStatsText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: '#FFF8DC',
    padding: 10,
    borderRadius: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 6,
  },
  suggestionButton: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 11,
    color: '#8B4513',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
    backgroundColor: '#F8F8F8',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginVertical: 15,
  },
  authRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 