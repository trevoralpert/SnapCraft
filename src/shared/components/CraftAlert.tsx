import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface CraftAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  onCancel?: () => void;
}

export default function CraftAlert({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  confirmText = 'OK',
  onConfirm,
  cancelText,
  onCancel
}: CraftAlertProps) {
  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return '#228B22'; // Forest green
      case 'warning': return '#DAA520'; // Goldenrod
      case 'error': return '#CD853F'; // Peru (craft-friendly error color)
      default: return '#8B4513'; // Saddle brown
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Header with icon */}
          <View style={styles.header}>
            <Ionicons 
              name={getIcon()} 
              size={32} 
              color={getIconColor()} 
            />
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {cancelText && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>

          {/* Craft decoration */}
          <View style={styles.craftDecoration}>
            <Text style={styles.craftIcon}>🔨</Text>
          </View>
        </View>
      </View>
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
    backgroundColor: '#F5F5DC', // Beige
    borderRadius: 16,
    padding: 24,
    width: screenWidth * 0.85,
    maxWidth: 400,
    shadowColor: '#8B4513',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#D2B48C', // Tan border
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginLeft: 12,
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: '#5D4037',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'left',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#8B4513',
    shadowColor: '#654321',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  cancelButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
  craftDecoration: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#8B4513',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  craftIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
}); 