import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

export interface CustomLinkProps extends Omit<RouterLinkProps, 'to'> {
  to?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export const Link: React.FC<CustomLinkProps> = ({ to, href, children, className, ...props }) => {
  const destination = to || href || '#';
  return (
    <RouterLink to={destination} className={className} {...props}>
      {children}
    </RouterLink>
  );
};

export default Link;
