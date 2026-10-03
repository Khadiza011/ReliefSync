import { motion } from 'framer-motion';
import { useSpotlight } from '../../hooks/useUi';
import { cx } from '../../utils/helpers';
import { fadeUp } from '../../utils/motion';

/** Glass surface. `spotlight` adds the cursor-tracked glow, `interactive` a hover lift. */
export function Card({ className, spotlight = false, interactive = false, animate = true, delay = 0, children, ...rest }) {
  const onMove = useSpotlight();
  const classes = cx('card', spotlight && 'spotlight', interactive && 'card--interactive', className);

  if (!animate) {
    return (
      <div className={classes} onMouseMove={spotlight ? onMove : undefined} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={classes}
      onMouseMove={spotlight ? onMove : undefined}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cx('card__header', className)}>
      <div style={{ minWidth: 0 }}>
        <h3 className="card__title">
          {Icon && (
            <span className="card__title-icon" aria-hidden="true">
              <Icon />
            </span>
          )}
          {title}
        </h3>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="row" style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

export function CardBody({ flush = false, className, children, ...rest }) {
  return (
    <div className={cx('card__body', flush && 'card__body--flush', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }) {
  return <div className={cx('card__footer', className)}>{children}</div>;
}

export default Card;
