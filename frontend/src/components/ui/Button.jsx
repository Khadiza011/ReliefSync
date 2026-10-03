import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../utils/helpers';

/**
 * Button — variants: primary | secondary | ghost | outline | danger | danger-soft | success-soft
 * sizes: sm | md | lg. Pass `to` to render a router link styled as a button.
 */
export const Button = forwardRef(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    block = false,
    iconOnly = false,
    leftIcon,
    rightIcon,
    to,
    href,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref
) {
  const classes = cx(
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    iconOnly && 'btn--icon',
    loading && 'btn--loading',
    className
  );

  const content = (
    <>
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : leftIcon}
      {children != null && <span className="btn__label">{children}</span>}
      {!loading && rightIcon}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
