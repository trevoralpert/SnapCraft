// Task 3.3: Visual Hierarchy Improvements - Animation Utilities
import { Animated, Easing } from 'react-native';
import { ANIMATION_DURATIONS } from '../constants/Typography';

// Craft-themed animation presets
export const CRAFT_ANIMATIONS = {
  // Gentle bounce (like wood settling)
  gentleBounce: {
    tension: 200,
    friction: 8,
    useNativeDriver: true,
  },
  
  // Smooth slide (like sliding a drawer)
  smoothSlide: {
    duration: ANIMATION_DURATIONS.normal,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  },
  
  // Quick snap (like a tool clicking into place)
  quickSnap: {
    tension: 300,
    friction: 10,
    useNativeDriver: true,
  },
  
  // Fade transition (like dust settling)
  fadeTransition: {
    duration: ANIMATION_DURATIONS.normal,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  },
} as const;

// Animation helper functions
export const createFadeAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATIONS.normal
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  });
};

export const createScaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  config = CRAFT_ANIMATIONS.gentleBounce
) => {
  return Animated.spring(animatedValue, {
    toValue,
    ...config,
  });
};

export const createSlideAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  config = CRAFT_ANIMATIONS.smoothSlide
) => {
  return Animated.timing(animatedValue, {
    toValue,
    ...config,
  });
};

export const createRotateAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = ANIMATION_DURATIONS.normal
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.linear,
    useNativeDriver: true,
  });
};

// Staggered animations for lists
export const createStaggeredAnimation = (
  animations: Animated.CompositeAnimation[],
  delay: number = 100
) => {
  return Animated.stagger(delay, animations);
};

// Sequence animations
export const createSequenceAnimation = (
  animations: Animated.CompositeAnimation[]
) => {
  return Animated.sequence(animations);
};

// Parallel animations
export const createParallelAnimation = (
  animations: Animated.CompositeAnimation[]
) => {
  return Animated.parallel(animations);
};

// Craft-specific animation combinations
export const craftPressAnimation = (
  scaleValue: Animated.Value,
  opacityValue: Animated.Value
) => {
  const pressIn = () => {
    return createParallelAnimation([
      createScaleAnimation(scaleValue, 0.95, CRAFT_ANIMATIONS.quickSnap),
      createFadeAnimation(opacityValue, 0.8, ANIMATION_DURATIONS.fast),
    ]);
  };

  const pressOut = () => {
    return createParallelAnimation([
      createScaleAnimation(scaleValue, 1, CRAFT_ANIMATIONS.gentleBounce),
      createFadeAnimation(opacityValue, 1, ANIMATION_DURATIONS.fast),
    ]);
  };

  return { pressIn, pressOut };
};

export const craftSlideInAnimation = (
  translateValue: Animated.Value,
  opacityValue: Animated.Value,
  fromDirection: 'left' | 'right' | 'top' | 'bottom' = 'bottom'
) => {
  const initialValue = fromDirection === 'left' ? -100 : 
                      fromDirection === 'right' ? 100 :
                      fromDirection === 'top' ? -100 : 100;

  return createSequenceAnimation([
    createParallelAnimation([
      createSlideAnimation(translateValue, initialValue),
      createFadeAnimation(opacityValue, 0, 0),
    ]),
    createParallelAnimation([
      createSlideAnimation(translateValue, 0, CRAFT_ANIMATIONS.smoothSlide),
      createFadeAnimation(opacityValue, 1, CRAFT_ANIMATIONS.fadeTransition),
    ]),
  ]);
};

// Loading animations
export const createLoadingAnimation = (
  rotateValue: Animated.Value,
  loop: boolean = true
) => {
  const animation = createRotateAnimation(rotateValue, 1, 2000);
  
  if (loop) {
    return Animated.loop(animation);
  }
  
  return animation;
};

// Shake animation for errors
export const createShakeAnimation = (
  translateValue: Animated.Value,
  intensity: number = 10
) => {
  return createSequenceAnimation([
    createSlideAnimation(translateValue, intensity, { ...CRAFT_ANIMATIONS.quickSnap, duration: 100 }),
    createSlideAnimation(translateValue, -intensity, { ...CRAFT_ANIMATIONS.quickSnap, duration: 100 }),
    createSlideAnimation(translateValue, intensity, { ...CRAFT_ANIMATIONS.quickSnap, duration: 100 }),
    createSlideAnimation(translateValue, 0, { ...CRAFT_ANIMATIONS.quickSnap, duration: 100 }),
  ]);
};

// Pulse animation for notifications
export const createPulseAnimation = (
  scaleValue: Animated.Value,
  intensity: number = 1.1
) => {
  return Animated.loop(
    createSequenceAnimation([
      createScaleAnimation(scaleValue, intensity, CRAFT_ANIMATIONS.gentleBounce),
      createScaleAnimation(scaleValue, 1, CRAFT_ANIMATIONS.gentleBounce),
    ])
  );
}; 