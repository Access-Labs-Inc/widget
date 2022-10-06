import { FunctionalComponent, type ComponentChildren, h } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';

export type CollapseProps = {
  children: ComponentChildren;
  expanded: boolean;
  id: string;
};

export const Collapse: FunctionalComponent<CollapseProps> = ({
  id,
  children,
  expanded = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const instant = useRef(true);
  const transition = 'height 250ms ease-out';

  const openCollapse = () => {
    const node = ref.current;
    if (!node) return;

    requestAnimationFrame(() => {
      node.style.height = node.scrollHeight + 'px';
    });
  };

  const closeCollapse = () => {
    const node = ref.current;
    if (!node) return;

    requestAnimationFrame(() => {
      node.style.height = node.offsetHeight + 'px';
      node.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        node.style.height = '0';
      });
    });
  };

  useLayoutEffect(() => {
    if (expanded) {
      openCollapse();
    } else {
      closeCollapse();
    }
  }, [expanded]);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    function handleComplete() {
      if (!node) return;

      node.style.overflow = expanded ? 'initial' : 'hidden';
      if (expanded) {
        node.style.height = 'auto';
      }
    }

    function handleTransitionEnd(event: TransitionEvent) {
      if (node && event.target === node && event.propertyName === 'height') {
        handleComplete();
      }
    }

    if (instant.current) {
      handleComplete();
      instant.current = false;
    }

    node.addEventListener('transitionend', handleTransitionEnd);
    return () => node.removeEventListener('transitionend', handleTransitionEnd);
  }, [expanded]);

  return (
    <div
      className="wallet-adapter-collapse"
      id={id}
      ref={ref}
      role="region"
      style={{
        height: 0,
        transition: instant.current ? undefined : transition,
      }}
    >
      {children}
    </div>
  );
};
