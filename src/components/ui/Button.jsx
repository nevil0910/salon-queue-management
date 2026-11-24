import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'

export function Button({ children, to, variant = 'primary', className = '', ...props }) {
  const reduceMotion = useReducedMotion()
  const classes = `button button--${variant} ${className}`.trim()
  const motionProps = {
    whileHover: reduceMotion ? undefined : { y: -2 },
    whileTap: reduceMotion ? undefined : { scale: 0.98 },
    transition: { duration: 0.18 },
  }

  if (to) {
    return <motion.div {...motionProps} className="button-motion"><Link className={classes} to={to} {...props}>{children}</Link></motion.div>
  }

  return <motion.button className={classes} {...motionProps} {...props}>{children}</motion.button>
}
