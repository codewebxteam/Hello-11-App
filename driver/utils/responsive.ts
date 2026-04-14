import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

export const scale = (size: number, width: number) => (width / BASE_WIDTH) * size;
export const verticalScale = (size: number, height: number) => (height / BASE_HEIGHT) * size;
export const moderateScale = (size: number, width: number, factor = 0.35) =>
  size + (scale(size, width) - size) * factor;

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isSmallPhone = width < 360;
    const isLargePhone = width >= 412;
    const isTablet = width >= 768;

    const horizontalPadding = isTablet ? 28 : isSmallPhone ? 14 : 18;
    const modalHorizontalPadding = isTablet ? 28 : isSmallPhone ? 12 : 16;
    const cardRadius = Math.round(moderateScale(20, width, 0.25));
    const controlHeight = Math.max(52, Math.round(verticalScale(56, height)));

    return {
      width,
      height,
      isSmallPhone,
      isLargePhone,
      isTablet,
      horizontalPadding,
      modalHorizontalPadding,
      cardRadius,
      controlHeight,
      scale: (value: number) => scale(value, width),
      verticalScale: (value: number) => verticalScale(value, height),
      moderateScale: (value: number, factor?: number) => moderateScale(value, width, factor),
    };
  }, [width, height]);
};
