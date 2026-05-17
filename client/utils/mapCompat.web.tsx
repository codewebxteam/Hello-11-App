import React from "react";
import { View } from "react-native";

type AnyProps = {
  children?: React.ReactNode;
  style?: any;
};

const MapView = ({ children, style }: AnyProps) => <View style={style}>{children}</View>;
const Marker = () => null;
const Polyline = () => null;
const PROVIDER_GOOGLE = undefined as any;

export { Marker, Polyline, PROVIDER_GOOGLE };
export default MapView;
