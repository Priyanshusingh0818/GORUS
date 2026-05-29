import React from 'react';

const getWebpSource = (src = '') => {
  if (!/\.(jpe?g)$/i.test(src)) return '';
  return src.replace(/\.(jpe?g)$/i, '.webp');
};

const OptimizedImage = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  sizes,
  ...props
}) => {
  const webpSrc = getWebpSource(src);

  return (
    <picture className="block h-full w-full">
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
        draggable="false"
        {...props}
      />
    </picture>
  );
};

export default OptimizedImage;
