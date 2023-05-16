import React, {
  useState,
  useLayoutEffect,
  useRef,
  DetailedHTMLProps,
  ImgHTMLAttributes,
} from "react";
import ResizeObserver from "resize-observer-polyfill";
import Photo, { RenderImageProps } from "./Photo";
import { computeColumnLayout } from "./layouts/columns";
import { computeRowLayout } from "./layouts/justified";
import { findIdealNodeSearch } from "./utils/findIdealNodeSearch";

interface GalleryProps {
  photos: React.ComponentProps<"img">[];
  direction?: "row" | "column";
  onClick?(
    e: React.MouseEvent,
    options: {
      index: number;
      photo: DetailedHTMLProps<
        ImgHTMLAttributes<HTMLImageElement>,
        HTMLImageElement
      >;
      previous: DetailedHTMLProps<
        ImgHTMLAttributes<HTMLImageElement>,
        HTMLImageElement
      > | null;
      next: DetailedHTMLProps<
        ImgHTMLAttributes<HTMLImageElement>,
        HTMLImageElement
      > | null;
    }
  ): void;
  columns?: ((containerWidth: number) => number) | number;
  targetRowHeight?: ((containerWidth: number) => number) | number;
  limitNodeSearch?: ((containerWidth: number) => number) | number;
  margin?: number;
  renderImage?: React.FC<RenderImageProps>;
}

const Gallery = React.memo(function Gallery({
  photos,
  onClick,
  direction = "row",
  margin,
  limitNodeSearch,
  targetRowHeight,
  columns,
  renderImage,
}: GalleryProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const galleryEl = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    let animationFrameID: number | null = null;
    const observer = new ResizeObserver((entries: any[]) => {
      // only do something if width changes
      const newWidth = entries[0].contentRect.width;
      if (containerWidth !== newWidth) {
        // put in an animation frame to stop "benign errors" from
        // ResizObserver https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
        animationFrameID = window.requestAnimationFrame(() => {
          setContainerWidth(Math.floor(newWidth));
        });
      }
    });
    if (galleryEl.current) observer.observe(galleryEl.current);
    return () => {
      observer.disconnect();
      if (animationFrameID) window.cancelAnimationFrame(animationFrameID);
    };
  });

  const handleClick: RenderImageProps["onClick"] = (event, { index }) => {
    if (onClick)
      onClick(event, {
        index,
        photo: photos[index],
        previous: photos[index - 1] || null,
        next: photos[index + 1] || null,
      });
  };

  // no containerWidth until after first render with refs, skip calculations and render nothing
  if (!containerWidth) return <div ref={galleryEl}>&nbsp;</div>;
  // subtract 1 pixel because the browser may round up a pixel
  const width = containerWidth - 1;
  let galleryStyle: React.CSSProperties = {};
  let thumbs: any[] = [];

  if (direction === "row") {
    let finalNodeSearch =
      typeof limitNodeSearch === "function"
        ? limitNodeSearch(containerWidth)
        : limitNodeSearch;
    let finalTargetRowHeight =
      typeof targetRowHeight === "function"
        ? targetRowHeight(containerWidth)
        : targetRowHeight;
    // set how many neighboring nodes the graph will visit
    if (finalNodeSearch === undefined) {
      finalNodeSearch = 2;
      if (containerWidth >= 450) {
        finalNodeSearch = findIdealNodeSearch({
          containerWidth,
          targetRowHeight: finalTargetRowHeight,
        });
      }
    }

    galleryStyle = { display: "flex", flexWrap: "wrap", flexDirection: "row" };
    thumbs = computeRowLayout({
      containerWidth: width,
      limitNodeSearch,
      targetRowHeight,
      margin,
      photos,
    });
  }
  if (direction === "column") {
    // allow user to calculate columns from containerWidth
    let finalColumns =
      typeof columns === "function" ? columns(containerWidth) : columns;
    // set default breakpoints if user doesn't specify columns prop
    if (finalColumns === undefined) {
      finalColumns = 1;
      if (containerWidth >= 500) finalColumns = 2;
      if (containerWidth >= 900) finalColumns = 3;
      if (containerWidth >= 1500) finalColumns = 4;
    }
    galleryStyle = { position: "relative" };
    thumbs = computeColumnLayout({
      containerWidth: width,
      columns,
      margin,
      photos,
    });
    galleryStyle.height = thumbs[thumbs.length - 1].containerHeight;
  }

  const renderComponent = renderImage || Photo;
  return (
    <div className="react-photo-gallery--gallery">
      <div ref={galleryEl} style={galleryStyle}>
        {thumbs.map((thumb, index) => {
          const { left, top, containerHeight, ...photo } = thumb;
          return React.createElement(renderComponent, {
            left,
            top,
            key: thumb.key || thumb.src,
            index,
            margin: margin?.toString(),
            direction,
            onClick: onClick ? handleClick : undefined,
            photo,
          });
        })}
      </div>
    </div>
  );
});

export { Photo };
export default Gallery;
