const React = require('react');

module.exports = React.forwardRef(function MockImage(props, ref) {
  // Extract Next.js specific props that shouldn't be passed to img element
  const {
    src,
    alt,
    width,
    height,
    className,
    unoptimized,
    priority,
    loading,
    quality,
    fill,
    sizes,
    ...rest
  } = props;

  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return React.createElement('img', {
    ref,
    src,
    alt,
    width,
    height,
    className,
    ...rest
  });
});

module.exports.default = module.exports;
