import { useEffect, useRef, useState } from 'react';

// Defers mounting expensive children (e.g. a live animated SVG pizza) until
// the wrapper scrolls into view. Keeps a long order history light — only the
// thumbnails actually on screen render their full animation.
const LazyMount = ({ children, placeholder = null, rootMargin = '200px' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true); // fail open if unsupported
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return <div ref={ref}>{visible ? children : placeholder}</div>;
};

export default LazyMount;
