// import { Image } from "expo-image";
import { useId } from "react";
import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";
import Svg, { ClipPath, Defs, Image, Path, Text } from "react-native-svg";

interface Material3AvatarProps {
	letter?: string;
	backgroundColor?: string;
	textColor?: string;
	style?: StyleProp<ViewStyle>;
	photo?: string | ImageSourcePropType;
	size?: number;
}

const Material3Avatar = ({
	letter,
	backgroundColor,
	textColor,
	style,
	photo,
	size = 200,
}: Material3AvatarProps) => {
	const theme = useTheme();
	const clipPathId = useId();

	const pathData = `M85.812 11.542a22.48 22.48 0 0 1 28.376 0 22.48 22.48 0 0 0 17.754 4.758 22.48 22.48 0 0 1 24.574 14.188 22.48 22.48 0 0 0 12.998 12.998 22.48 22.48 0 0 1 14.188 24.574 22.48 22.48 0 0 0 4.758 17.754 22.48 22.48 0 0 1 0 28.376 22.48 22.48 0 0 0 -4.758 17.754 22.48 22.48 0 0 1 -14.188 24.574 22.48 22.48 0 0 0 -12.998 12.998 22.48 22.48 0 0 1 -24.574 14.188 22.48 22.48 0 0 0 -17.754 4.758 22.48 22.48 0 0 1 -28.376 0 22.48 22.48 0 0 0 -17.754 -4.758 22.48 22.48 0 0 1 -24.574 -14.188 22.48 22.48 0 0 0 -12.996 -12.998A22.48 22.48 0 0 1 16.3 131.944a22.48 22.48 0 0 0 -4.758 -17.754 22.48 22.48 0 0 1 0 -28.376A22.48 22.48 0 0 0 16.3 68.06a22.48 22.48 0 0 1 14.188 -24.574 22.48 22.48 0 0 0 12.998 -12.996A22.48 22.48 0 0 1 68.06 16.302a22.48 22.48 0 0 0 17.754 -4.758`;

	// Keep viewBox at original size (200) so path coordinates remain valid
	const viewBoxSize = 200;
	const viewBoxCenter = viewBoxSize / 2;
	const viewBoxFontSize = viewBoxSize * 0.5;

	if (photo) {
		return (
			<Svg
				height={size}
				width={size}
				viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
				style={style}
			>
				{/* 1. Define the clipping path */}
				<Defs>
					<ClipPath id={clipPathId}>
						{/* This path creates a rectangle with a diagonal slice at the top right */}
						<Path
							d={pathData}
							fill={backgroundColor || theme.colors.surfaceVariant}
						/>
					</ClipPath>
				</Defs>

				{/* 2. Apply the clipping path to the image */}
				<Image
					href={typeof photo === "string" ? { uri: photo } : photo}
					width="100%"
					height="100%"
					preserveAspectRatio="xMidYMid slice"
					clipPath={`url(#${clipPathId})`}
				/>
			</Svg>
		);
	}

	return (
		<Svg
			height={size}
			width={size}
			viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
			style={style}
		>
			{/* The scalloped shape */}
			<Path
				d={pathData}
				fill={backgroundColor || theme.colors.surfaceVariant}
			/>

			{/* The centered letter */}
			<Text
				x={viewBoxCenter}
				y={viewBoxCenter}
				fill={textColor || theme.colors.onSurfaceVariant}
				fontSize={viewBoxFontSize}
				fontWeight="400"
				textAnchor="middle"
				alignmentBaseline="central"
			>
				{letter}
			</Text>
		</Svg>
	);
};

export default Material3Avatar;
