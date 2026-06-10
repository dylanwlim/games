"use client";

import {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useMotionValue, type Transition } from "motion/react";

import { cn } from "@/lib/utils";

export type CarouselContextType = {
  disableDrag: boolean;
  index: number;
  itemsCount: number;
  setIndex: (newIndex: number) => void;
  setItemsCount: (newItemsCount: number) => void;
};

const CarouselContext = createContext<CarouselContextType | undefined>(undefined);

function useCarousel() {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a CarouselProvider");
  }

  return context;
}

export type CarouselProviderProps = {
  children: ReactNode;
  disableDrag?: boolean;
  index: number;
  onIndexChange?: (newIndex: number) => void;
};

function CarouselProvider({
  children,
  disableDrag = false,
  index,
  onIndexChange,
}: CarouselProviderProps) {
  const [itemsCount, setItemsCount] = useState(0);

  const handleSetIndex = (newIndex: number) => {
    onIndexChange?.(newIndex);
  };

  return (
    <CarouselContext.Provider
      value={{
        disableDrag,
        index,
        itemsCount,
        setIndex: handleSetIndex,
        setItemsCount,
      }}
    >
      {children}
    </CarouselContext.Provider>
  );
}

export type CarouselProps = {
  children: ReactNode;
  className?: string;
  disableDrag?: boolean;
  index?: number;
  initialIndex?: number;
  onIndexChange?: (newIndex: number) => void;
};

function Carousel({
  children,
  className,
  disableDrag = false,
  index: externalIndex,
  initialIndex = 0,
  onIndexChange,
}: CarouselProps) {
  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const isControlled = externalIndex !== undefined;
  const currentIndex = isControlled ? externalIndex : internalIndex;

  const handleIndexChange = (newIndex: number) => {
    if (!isControlled) {
      setInternalIndex(newIndex);
    }

    onIndexChange?.(newIndex);
  };

  return (
    <CarouselProvider
      disableDrag={disableDrag}
      index={currentIndex}
      onIndexChange={handleIndexChange}
    >
      <div className={cn("group/hover relative", className)}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </CarouselProvider>
  );
}

export type CarouselNavigationProps = {
  alwaysShow?: boolean;
  className?: string;
  classNameButton?: string;
};

function CarouselNavigation({ alwaysShow, className, classNameButton }: CarouselNavigationProps) {
  const { index, itemsCount, setIndex } = useCarousel();

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-[-12.5%] top-1/2 flex w-[125%] -translate-y-1/2 justify-between px-2",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Previous slide"
        className={cn(
          "pointer-events-auto h-fit w-fit rounded-full bg-zinc-50 p-2 transition-opacity duration-300 dark:bg-zinc-950",
          alwaysShow ? "opacity-100" : "opacity-0 group-hover/hover:opacity-100",
          alwaysShow ? "disabled:opacity-40" : "group-hover/hover:disabled:opacity-40",
          classNameButton,
        )}
        disabled={index === 0}
        onClick={() => {
          if (index > 0) {
            setIndex(index - 1);
          }
        }}
      >
        <ChevronLeft className="stroke-zinc-600 dark:stroke-zinc-50" size={16} />
      </button>
      <button
        type="button"
        className={cn(
          "pointer-events-auto h-fit w-fit rounded-full bg-zinc-50 p-2 transition-opacity duration-300 dark:bg-zinc-950",
          alwaysShow ? "opacity-100" : "opacity-0 group-hover/hover:opacity-100",
          alwaysShow ? "disabled:opacity-40" : "group-hover/hover:disabled:opacity-40",
          classNameButton,
        )}
        aria-label="Next slide"
        disabled={index + 1 === itemsCount}
        onClick={() => {
          if (index < itemsCount - 1) {
            setIndex(index + 1);
          }
        }}
      >
        <ChevronRight className="stroke-zinc-600 dark:stroke-zinc-50" size={16} />
      </button>
    </div>
  );
}

export type CarouselIndicatorProps = {
  className?: string;
  classNameButton?: string;
};

function CarouselIndicator({ className, classNameButton }: CarouselIndicatorProps) {
  const { index, itemsCount, setIndex } = useCarousel();

  return (
    <div
      className={cn("absolute bottom-0 z-10 flex w-full items-center justify-center", className)}
    >
      <div className="flex space-x-2">
        {Array.from({ length: itemsCount }, (_, itemIndex) => (
          <button
            key={itemIndex}
            type="button"
            aria-label={`Go to slide ${itemIndex + 1}`}
            onClick={() => setIndex(itemIndex)}
            className={cn(
              "h-2 w-2 rounded-full transition-opacity duration-300",
              index === itemIndex
                ? "bg-zinc-950 dark:bg-zinc-50"
                : "bg-zinc-900/50 dark:bg-zinc-100/50",
              classNameButton,
            )}
          />
        ))}
      </div>
    </div>
  );
}

export type CarouselContentProps = {
  children: ReactNode;
  className?: string;
  transition?: Transition;
};

function CarouselContent({ children, className, transition }: CarouselContentProps) {
  const { disableDrag, index, setIndex, setItemsCount } = useCarousel();
  const [visibleItemsCount, setVisibleItemsCount] = useState(1);
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsLength = Children.count(children);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleCount = entries.filter((entry) => entry.isIntersecting).length;
        setVisibleItemsCount(Math.max(1, visibleCount));
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      },
    );

    Array.from(containerRef.current.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    setItemsCount(itemsLength);
  }, [itemsLength, setItemsCount]);

  const onDragEnd = () => {
    const x = dragX.get();

    if (x <= -10 && index < itemsLength - 1) {
      setIndex(index + 1);
    } else if (x >= 10 && index > 0) {
      setIndex(index - 1);
    }
  };

  return (
    <motion.div
      drag={disableDrag ? false : "x"}
      dragConstraints={disableDrag ? undefined : { left: 0, right: 0 }}
      dragMomentum={disableDrag ? undefined : false}
      style={{ x: disableDrag ? undefined : dragX }}
      animate={{ translateX: `-${index * (100 / visibleItemsCount)}%` }}
      onDragEnd={disableDrag ? undefined : onDragEnd}
      transition={
        transition ?? {
          damping: 18,
          stiffness: 90,
          type: "spring",
          duration: 0.2,
        }
      }
      className={cn(
        "flex items-center",
        !disableDrag && "cursor-grab active:cursor-grabbing",
        className,
      )}
      ref={containerRef}
    >
      {children}
    </motion.div>
  );
}

export type CarouselItemProps = {
  children: ReactNode;
  className?: string;
};

function CarouselItem({ children, className }: CarouselItemProps) {
  return (
    <motion.div className={cn("w-full min-w-0 shrink-0 grow-0 overflow-hidden", className)}>
      {children}
    </motion.div>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselNavigation,
  useCarousel,
};
