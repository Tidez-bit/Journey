import { Variants } from 'framer-motion';

// 9.1 Page Transitions
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

// 9.2 Card Hover Effects
export const cardHoverVariants = {
  hover: { scale: 1.02, y: -4, transition: { duration: 0.2 } }
};

// 9.3 Button Interactions
export const buttonTapVariants = {
  tap: { scale: 0.96, transition: { duration: 0.1 } }
};

// 9.4 List Animations
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};
