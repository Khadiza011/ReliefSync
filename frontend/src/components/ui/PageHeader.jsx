import { motion } from 'framer-motion';
import { fadeUp, stagger } from '../../utils/motion';

export function PageHeader({ eyebrow, eyebrowIcon: EyebrowIcon, title, description, actions }) {
  return (
    <motion.header className="page-header" variants={stagger(0.06)} initial="hidden" animate="show">
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <motion.div className="page-header__eyebrow" variants={fadeUp}>
            {EyebrowIcon && <EyebrowIcon aria-hidden="true" />}
            {eyebrow}
          </motion.div>
        )}
        <motion.h1 className="page-header__title" variants={fadeUp}>
          {title}
        </motion.h1>
        {description && (
          <motion.p className="page-header__description" variants={fadeUp}>
            {description}
          </motion.p>
        )}
      </div>
      {actions && (
        <motion.div className="page-header__actions" variants={fadeUp}>
          {actions}
        </motion.div>
      )}
    </motion.header>
  );
}

export default PageHeader;
