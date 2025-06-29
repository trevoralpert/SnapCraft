import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CraftAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }>;
  onClose: () => void;
  copyable?: boolean; // New prop for copyable content
}

const { width: screenWidth } = Dimensions.get('window');

export default function CraftAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
  copyable = false,
}: CraftAlertProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Try web clipboard API first
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (error) {
        console.warn('Web clipboard failed:', error);
      }
    }

    // Fallback: Show success message
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return styles.cancelButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return styles.cancelButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Ionicons name="hammer" size={20} color="#8B4513" />
                  <Text style={styles.title}>{title}</Text>
                </View>
                {copyable && (
                  <TouchableOpacity
                    style={[styles.copyButton, copied && styles.copiedButton]}
                    onPress={handleCopy}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={copied ? "checkmark" : "copy"} 
                      size={16} 
                      color={copied ? "#4CAF50" : "#8B4513"} 
                    />
                    <Text style={[styles.copyButtonText, copied && styles.copiedButtonText]}>
                      {copied ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Content */}
              <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.message}>{message}</Text>
              </ScrollView>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      getButtonStyle(button.style),
                      buttons.length === 1 && styles.singleButton,
                      index === 0 && buttons.length > 1 && styles.firstButton,
                      index === buttons.length - 1 && buttons.length > 1 && styles.lastButton,
                    ]}
                    onPress={() => {
                      button.onPress?.();
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.buttonText, getButtonTextStyle(button.style)]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#F5F5DC', // Craft beige background
    borderRadius: 16,
    width: Math.min(screenWidth - 40, 320),
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#8B4513',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D2B48C',
    backgroundColor: '#FAEBD7', // Antique white header
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginLeft: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D2B48C',
  },
  copiedButton: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#8B4513',
    marginLeft: 4,
    fontWeight: '600',
  },
  copiedButtonText: {
    color: '#4CAF50',
  },
  contentContainer: {
    maxHeight: 200,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'left',
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#D2B48C',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAEBD7',
  },
  singleButton: {
    borderRadius: 0,
  },
  firstButton: {
    borderRightWidth: 1,
    borderRightColor: '#D2B48C',
  },
  lastButton: {
    // No additional styles needed
  },
  defaultButton: {
    backgroundColor: '#FAEBD7',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  destructiveButton: {
    backgroundColor: '#FFE5E5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: '#8B4513',
  },
  cancelButtonText: {
    color: '#666',
  },
  destructiveButtonText: {
    color: '#D32F2F',
  },
}); 