import React, { MouseEventHandler } from "react";

const imgWithClick = { cursor: "pointer" };

/**
 * If you're passing a function component to renderImage you will receive back these props:
 */
export interface RenderImageProps {
  /**
   * margin prop optionally passed into Gallery by user
   */
  margin?: string;
  /**
   * the index of the photo within the Gallery
   */
  index: number;
  /**
   * the individual object passed into Gallery's
   * photos array prop, with all the same props except recalculated height and width
   */
  photo: React.ComponentProps<"img">;

  onClick?: (
    event: React.MouseEvent,
    photo: { photo: React.ComponentProps<"img"> } & {
      index: number;
    }
  ) => void;
  direction: "row" | "column";
  top?: number;
  left?: number;
}

const Photo = ({
  index,
  onClick,
  photo,
  margin,
  direction,
  top,
  left,
}: RenderImageProps) => {
  const imgStyle: React.CSSProperties = { margin: margin, display: "block" };
  if (direction === "column") {
    imgStyle.position = "absolute";
    imgStyle.left = left;
    imgStyle.top = top;
  }

  const handleClick: MouseEventHandler<HTMLImageElement> = (event) => {
    if (onClick) onClick(event, { photo, index });
  };

  return (
    <img
      style={onClick ? { ...imgStyle, ...imgWithClick } : imgStyle}
      {...photo}
      onClick={onClick ? handleClick : undefined}
    />
  );
};

export default Photo;
