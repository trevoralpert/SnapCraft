import React from 'react';
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
import { CraftPost } from '../types';
import { SharingService, ShareResult } from '../../services/sharing/SharingService';

interface SharingModalProps {
  visible: boolean;
  post: CraftPost | null;
  onClose: () => void;
  onShareComplete: (result: ShareResult) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SharingModal({ 
  visible, 
  post, 
  onClose, 
  onShareComplete 
}: SharingModalProps) {
  if (!post) return null;

  const handleShareOption = async (shareFunction: () => Promise<ShareResult>) => {
    try {
      const result = await shareFunction();
      onShareComplete(result);
      onClose();
    } catch (error) {
      console.error('Share error:', error);
      onShareComplete({
        success: false,
        error: error instanceof Error ? error.message : 'Share failed'
      });
      onClose();
    }
  };

  const shareOptions = [
    {
      id: 'copy',
      title: 'Copy Link',
      subtitle: 'Copy project link to clipboard',
      icon: 'link-outline' as const,
      color: '#8B4513',
      action: () => SharingService.copyPostLink(post),
    },
    {
      id: 'apps',
      title: 'Share via Apps',
      subtitle: 'Use device sharing options',
      icon: 'share-outline' as const,
      color: '#8B4513',
      action: () => SharingService.sharePost(post),
    },
    {
      id: 'twitter',
      title: 'Twitter',
      subtitle: 'Share to Twitter community',
      icon: 'logo-twitter' as const,
      color: '#1DA1F2',
      action: () => SharingService.shareToSocialMedia(post, 'twitter'),
    },
    {
      id: 'facebook',
      title: 'Facebook',
      subtitle: 'Share to Facebook friends',
      icon: 'logo-facebook' as const,
      color: '#1877F2',
      action: () => SharingService.shareToSocialMedia(post, 'facebook'),
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: 'Share via WhatsApp chat',
      icon: 'logo-whatsapp' as const,
      color: '#25D366',
      action: () => SharingService.shareToSocialMedia(post, 'whatsapp'),
    },
  ];

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
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Ionicons name="hammer" size={24} color="#8B4513" />
                  <Text style={styles.headerTitle}>Share Craft Project</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#8B4513" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content */}
              <ScrollView 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {/* Project Info */}
                <View style={styles.projectInfo}>
                  <Text style={styles.projectTitle}>
                    {post.author.displayName}'s {post.craftType} project
                  </Text>
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {post.content.description}
                  </Text>
                </View>

                {/* Sharing Options */}
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsTitle}>Choose sharing method:</Text>
                  
                  {shareOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.optionButton}
                      onPress={() => handleShareOption(option.action)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
                        <Ionicons name={option.icon} size={24} color={option.color} />
                      </View>
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#8B4513" />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Help spread craft knowledge in the community! 🔨
                  </Text>
                </View>
              </ScrollView>
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
  modalContainer: {
    backgroundColor: '#F5F5DC', // Craft beige background
    borderRadius: 16,
    width: Math.min(screenWidth - 40, 400),
    maxHeight: screenHeight * 0.75, // Reduced from 0.8 to 0.75
    minHeight: 400, // Ensure minimum height
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
    overflow: 'hidden', // Ensure content doesn't overflow rounded corners
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginLeft: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D2B48C',
  },
  scrollContainer: {
    flexGrow: 1, // Changed from flex: 1 to flexGrow: 1
  },
  projectInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D2B48C',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  optionsContainer: {
    padding: 20,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D2B48C',
    shadowColor: '#8B4513',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D2B48C',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  footer: {
    padding: 16,
    paddingTop: 0,
    alignItems: 'center',
    paddingBottom: 20, // Extra padding at bottom for scrolling
  },
  footerText: {
    fontSize: 13,
    color: '#8B4513',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 