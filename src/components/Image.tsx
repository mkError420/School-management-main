import React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const Image: React.FC<ImageProps> = ({ src, alt = '', width, height, className, ...props }) => {
  // Add /images/ prefix for local images that start with /
  const imageSrc = src.startsWith('/') && !src.startsWith('/images/')
    ? `/images${src}`
    : src;

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      {...props}
    />
  );
};

export default Image;
