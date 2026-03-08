/**
 * Modern Animation Presets for Framer Motion
 * Based on Material Design and iOS motion principles
 */

import { Variants, Transition } from 'framer-motion'

// ====================
// Transition Presets
// ====================

export const transitions = {
  // Smooth spring animation (default)
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,

  // Ultra smooth for hero/large surfaces
  ultraSmooth: {
    type: 'spring',
    stiffness: 220,
    damping: 28,
    mass: 1.05,
  } as Transition,

  // Bouncy animation
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 20,
  } as Transition,

  // Gentle spring
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  } as Transition,

  // Micro interaction
  micro: {
    duration: 0.18,
    ease: [0.33, 1, 0.68, 1],
  } as Transition,

  // Snappy animation
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
  } as Transition,

  // Linear easing
  linear: {
    duration: 0.2,
    ease: 'linear',
  } as Transition,

  // Ease out (most common)
  easeOut: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,

  // Ease in-out
  easeInOut: {
    duration: 0.3,
    ease: [0.4, 0, 0.6, 1],
  } as Transition,
}

// ====================
// Animation Variants
// ====================

// Fade animations
export const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(6px)',
    transition: {
      duration: 0.24,
      ease: [0.4, 0, 1, 1],
    },
  },
}

// Slide animations
export const slideVariants: Variants = {
  left: { x: '-100%' },
  right: { x: '100%' },
  up: { y: '-100%' },
  down: { y: '100%' },
  center: { x: 0, y: 0 },
}

export const slideInVariants: Variants = {
  hidden: (custom: 'left' | 'right' | 'up' | 'down' = 'up') => {
    const axis = custom === 'left' || custom === 'right' ? 'x' : 'y'
    const value = custom === 'left' || custom === 'up' ? -24 : 24

    return {
      opacity: 0,
      [axis]: value,
      filter: 'blur(6px)',
    }
  },
  visible: (_custom: 'left' | 'right' | 'up' | 'down' = 'up') => ({
    opacity: 1,
    x: 0,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: (custom: 'left' | 'right' | 'up' | 'down' = 'down') => {
    const axis = custom === 'left' || custom === 'right' ? 'x' : 'y'
    const value = custom === 'left' || custom === 'up' ? -24 : 24

    return {
      opacity: 0,
      [axis]: value,
      filter: 'blur(6px)',
      transition: {
        duration: 0.28,
        ease: [0.4, 0, 1, 1],
      },
    }
  },
}

// Scale animations
export const scaleVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
}

// Pop animation (modal/dialog)
export const popVariants: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: { 
    scale: 0.95, 
    opacity: 0,
    transition: transitions.easeOut,
  },
}

// Slide up from bottom (mobile sheet)
export const sheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: { 
    y: 0,
    transition: transitions.smooth,
  },
  exit: { 
    y: '100%',
    transition: transitions.easeOut,
  },
}

// List item stagger
export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: transitions.easeOut,
  },
}

export const staggeredListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (stagger = 0.08) => ({
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren: 0.12,
    },
  }),
}

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: transitions.easeOut,
  },
  exit: {
    opacity: 0,
    y: 12,
    filter: 'blur(6px)',
    transition: transitions.easeOut,
  },
}

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: transitions.snappy,
}

export const hoverLift = {
  y: -4,
  boxShadow: 'var(--shadow-md-modern)',
  transition: transitions.smooth,
}

// Tap animations
export const tapScale = {
  scale: 0.95,
}

// ====================
// Page Transitions
// ====================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: transitions.easeOut,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.easeOut,
  },
}

// ====================
// Skeleton Loading
// ====================

export const skeletonVariants: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ====================
// Success/Error Animations
// ====================

export const successVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
}

export const errorShake: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
}

// ====================
// Utility Functions
// ====================

/**
 * Creates a stagger container for list animations
 */
export const createStaggerContainer = (staggerDelay = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: staggerDelay,
    },
  },
})

/**
 * Creates a fade-in slide variant
 */
export const createFadeSlide = (direction: 'up' | 'down' | 'left' | 'right' = 'up', distance = 20): Variants => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const value = direction === 'down' || direction === 'right' ? distance : -distance

  return {
    hidden: { 
      opacity: 0, 
      [axis]: value,
    },
    visible: { 
      opacity: 1, 
      [axis]: 0,
    },
  } as Variants
}

/**
 * Creates a fade-up variant with configurable distance and delay
 */
export const createFadeUp = (distance = 24, delay = 0): Variants => ({
  hidden: {
    opacity: 0,
    y: distance,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.42,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -distance / 2,
    filter: 'blur(6px)',
    transition: {
      duration: 0.28,
      ease: [0.4, 0, 1, 1],
    },
  },
})

/**
 * Utility to build staggered child variants with fade + lift
 */
export const createStaggeredChildren = (staggerDelay = 0.08): Variants => ({
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
    },
  },
})

export const staggeredChild: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: transitions.easeOut,
  },
}
