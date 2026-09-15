import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Animated,
  Easing,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  Mask,
  G,
  Rect,
} from 'react-native-svg';

export type MascotPose = 'scratch' | 'shy' | 'thumbsUp';

export interface AnimatedMascotProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  initialPose?: MascotPose;
  pose?: MascotPose;
  onPoseChange?: (newPose: MascotPose) => void;
  autoCycle?: boolean;
  cycleInterval?: number;
  enableTapToCycle?: boolean;
  enableBlink?: boolean;
  enableFloating?: boolean;
  onPress?: () => void;
}

export default function AnimatedMascot({
  width = 340,
  height,
  style,
  initialPose = 'scratch',
  pose: controlledPose,
  onPoseChange,
  autoCycle = true,
  cycleInterval = 2800,
  enableTapToCycle = true,
  enableBlink = true,
  enableFloating = true,
  onPress,
}: AnimatedMascotProps) {
  const [internalPose, setInternalPose] = useState<MascotPose>(initialPose);
  const currentPose = controlledPose ?? internalPose;
  const [isBlinking, setIsBlinking] = useState(false);

  const aspectRatio = 384 / 308;
  const calculatedHeight = height ?? width / aspectRatio;

  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current; // -1 to 1 for float cycle
  const bounceAnim = useRef(new Animated.Value(0)).current; // 0 to 1 on hop/transition
  const poseTransitionAnim = useRef(new Animated.Value(1)).current; // scale pop on pose switch

  // 1. Idle Floating & Breathing Loop
  useEffect(() => {
    if (!enableFloating) return;

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    return () => floatLoop.stop();
  }, [enableFloating, floatAnim]);

  // 2. Eye Blinking Loop (for open-eye poses)
  useEffect(() => {
    if (!enableBlink) return;

    let isMounted = true;
    let blinkTimer: ReturnType<typeof setTimeout>;

    const triggerBlink = () => {
      const nextDelay = Math.random() * 2500 + 2800; // blink every 2.8s to 5.3s
      blinkTimer = setTimeout(() => {
        if (!isMounted) return;

        // Trigger eyelid closure for 130ms
        setIsBlinking(true);
        setTimeout(() => {
          if (isMounted) {
            setIsBlinking(false);
            triggerBlink();
          }
        }, 130);
      }, nextDelay);
    };

    triggerBlink();

    return () => {
      isMounted = false;
      clearTimeout(blinkTimer);
    };
  }, [enableBlink]);

  // 3. Auto-Cycle through the 3 poses continuously
  useEffect(() => {
    if (!autoCycle || controlledPose !== undefined) return;

    const poses: MascotPose[] = ['scratch', 'shy', 'thumbsUp'];
    const cycleTimer = setInterval(() => {
      // Lively transition hop on pose switch
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();

      setInternalPose((prev) => {
        const nextIndex = (poses.indexOf(prev) + 1) % poses.length;
        const nextPose = poses[nextIndex];
        if (onPoseChange) {
          onPoseChange(nextPose);
        }
        return nextPose;
      });
    }, cycleInterval);

    return () => clearInterval(cycleTimer);
  }, [autoCycle, cycleInterval, controlledPose, onPoseChange, bounceAnim]);

  // 4. Pose Switch Micro-Spring Trigger
  useEffect(() => {
    poseTransitionAnim.setValue(0.92);
    Animated.spring(poseTransitionAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [currentPose, poseTransitionAnim]);

  // Handle Tap on Mascot
  const handlePress = () => {
    // Joyful hop animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 130,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (enableTapToCycle) {
      const poses: MascotPose[] = ['scratch', 'shy', 'thumbsUp'];
      const currentIndex = poses.indexOf(currentPose);
      const nextPose = poses[(currentIndex + 1) % poses.length];
      setInternalPose(nextPose);
      if (onPoseChange) {
        onPoseChange(nextPose);
      }
    }

    if (onPress) {
      onPress();
    }
  };

  // Interpolated animated values
  const floatTranslateY = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [5, 0, -6],
  });

  const floatScaleY = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.985, 1, 1.025],
  });

  const floatScaleX = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.015, 1, 0.985],
  });

  const hopTranslateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  const hopRotate = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-3deg', '2deg'],
  });

  const shadowScaleX = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.07, 1, 0.88],
  });

  const shadowOpacity = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.28, 0.23, 0.16],
  });

  const maskId = 'belly_stripes_mask';

  return (
    <View style={[{ width, height: calculatedHeight, alignItems: 'center' }, style]}>
      {/* Touchable Mascot Wrapper */}
      <TouchableOpacity
        activeOpacity={0.96}
        onPress={handlePress}
        style={StyleSheet.absoluteFill}
      >
        {/* Animated Ground Shadow */}
        <Animated.View
          style={[
            styles.shadowContainer,
            {
              width,
              height: calculatedHeight,
              transform: [{ scaleX: shadowScaleX }],
              opacity: shadowOpacity,
            },
          ]}
        >
          <Svg width={width} height={calculatedHeight} viewBox="0 0 384 308">
            <Ellipse
              cx={currentPose === 'thumbsUp' ? 200 : 183.5}
              cy={298.5}
              rx={currentPose === 'thumbsUp' ? 84 : 97.5}
              ry={9.5}
              fill="#363636"
            />
          </Svg>
        </Animated.View>

        {/* Animated Body with Float, Bounce, Squash & Stretch */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateY: floatTranslateY },
                { translateY: hopTranslateY },
                { rotate: hopRotate },
                { scaleX: floatScaleX },
                { scaleY: floatScaleY },
                { scale: poseTransitionAnim },
              ],
            },
          ]}
        >
          <Svg
            width={width}
            height={calculatedHeight}
            viewBox="0 0 384 308"
            fill="none"
          >
            {/* 1. Left Cloud Ear / Tuft (Blue base + White cloud) */}
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M106.684 21.9022C106.906 17.936 110.193 14.7883 114.215 14.7883C116.99 14.7883 119.416 16.2875 120.726 18.5202C121.177 18.4376 121.635 18.3962 122.093 18.3965C126.258 18.3965 129.635 21.7729 129.635 25.9379C129.635 30.1028 126.258 33.4793 122.093 33.4793H114.552V33.4791H108.941C105.623 33.4791 102.934 30.7894 102.934 27.4713C102.934 24.9518 104.485 22.7945 106.684 21.9022Z"
              fill="#0F69FF"
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M98.4289 16.7944C98.6999 11.9638 102.703 8.13013 107.601 8.13013C110.982 8.13013 113.936 9.95598 115.531 12.6754C116.081 12.5748 116.638 12.5243 117.197 12.5247C122.27 12.5247 126.382 16.637 126.382 21.7097C126.382 26.7824 122.27 30.8947 117.197 30.8947H108.012V30.8945H101.178C97.1373 30.8945 93.8613 27.6185 93.8613 23.5774C93.8613 20.5087 95.7503 17.8813 98.4289 16.7944Z"
              fill="#FFFFFF"
            />

            {/* 2. Right Cloud Ear / Tuft (Blue base + White cloud) */}
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M248.128 34.957C248.348 31.0313 251.601 27.9158 255.582 27.9158C258.329 27.9158 260.73 29.3996 262.026 31.6095C262.473 31.5278 262.926 31.4868 263.38 31.4871C267.503 31.4871 270.845 34.829 270.845 38.9515C270.845 43.0739 267.503 46.4159 263.38 46.4159L255.916 46.4159L255.916 46.4157L250.362 46.4157C247.078 46.4157 244.416 43.7534 244.416 40.4693C244.416 37.9755 245.951 35.8402 248.128 34.957Z"
              fill="#0F69FF"
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M252.293 28.1361C252.573 23.1397 256.713 19.1746 261.78 19.1746C265.276 19.1746 268.332 21.0631 269.982 23.8757C270.55 23.7717 271.127 23.7195 271.705 23.7199C276.951 23.7199 281.205 27.9733 281.205 33.22C281.205 38.4667 276.951 42.7201 271.705 42.7201L262.204 42.7201L262.204 42.7199L255.137 42.7199C250.957 42.7199 247.568 39.3316 247.568 35.1517C247.568 31.9778 249.522 29.2602 252.293 28.1361Z"
              fill="#FFFFFF"
            />

            {/* Little sweat droplet on head (poses: scratch & shy) */}
            {(currentPose === 'scratch' || currentPose === 'shy') && (
              <G transform="translate(242, 50)">
                <Path
                  d="M10 2C9 0.5 11.5 -0.5 13.5 0.5C15.5 1.5 16.5 4 14.5 6C12.5 8 10.5 6 10 2Z"
                  fill="#0F69FF"
                />
                <Path
                  d="M8.5 1C7.5 -0.5 10 -1.2 12 -0.2C14 0.8 14.8 3.2 12.8 5C10.8 6.8 9 4.5 8.5 1Z"
                  fill="#FFFFFF"
                />
              </G>
            )}

            {/* 3. Outer Orange Crust (Back Layer) */}
            <Path
              d="M290.322 101.3C289.998 161.602 230.679 178.292 182.886 178.035C135.093 177.778 81.742 158.163 82.0538 100.18C82.3323 48.383 135.941 20.024 183.734 20.281C231.527 20.538 290.646 40.9988 290.322 101.3Z"
              fill="#E2852E"
            />

            {/* 4. Main Yellow Body Circle & Highlight */}
            <Circle cx={186.152} cy={140.399} r={112.14} fill="#FFFFFF" fillOpacity={0.3} />
            <Circle cx={186.152} cy={140.848} r={112.14} fill="#F5C857" />

            {/* 5. Legs / Feet */}
            {currentPose !== 'thumbsUp' ? (
              // Standing feet for scratch & shy
              <G>
                {/* Left foot */}
                <Path
                  d="M103.113 298.292C94.0901 275.034 110.381 263.681 119.654 260.912V231.008L165.518 242.638V298.292H103.113Z"
                  fill="#F5C857"
                />
                {/* Right foot */}
                <Path
                  d="M263.809 298.292C272.832 275.034 256.541 263.681 247.268 260.912V231.008L201.404 242.638V298.292H263.809Z"
                  fill="#F5C857"
                />
              </G>
            ) : (
              // Playful kick-up foot for thumbsUp (as seen in right UI screenshot)
              <G>
                {/* Kicked up Left foot (bent backward playfully) */}
                <G transform="translate(108, 258) rotate(-30) translate(-108, -258)">
                  <Path
                    d="M100 286C88 265 104 253 114 250V222L156 234V286H100Z"
                    fill="#F5C857"
                  />
                  {/* Subtle sole shadow */}
                  <Rect
                    x={99}
                    y={280}
                    width={57}
                    height={7}
                    rx={3.5}
                    fill="#EAA023"
                    fillOpacity={0.4}
                  />
                </G>
                {/* Supporting Right foot firmly on ground */}
                <Path
                  d="M263.809 298.292C272.832 275.034 256.541 263.681 247.268 260.912V231.008L201.404 242.638V298.292H263.809Z"
                  fill="#F5C857"
                />
              </G>
            )}

            {/* 6. Belly Stripes masked to body */}
            <Mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x={74}
              y={28}
              width={225}
              height={225}
            >
              <Circle cx={186.152} cy={140.848} r={112.14} fill="#FFFFFF" />
            </Mask>
            <G mask={`url(#${maskId})`}>
              <Circle cx={186.152} cy={264.65} r={112.14} fill="#E2852E" />
              <Circle cx={186.152} cy={284.387} r={112.14} fill="#F5C857" />
              <Circle cx={186.152} cy={306.815} r={112.14} fill="#FFEE91" />
              <Circle cx={186.152} cy={329.243} r={112.14} fill="#ABE0F0" />
              <Circle cx={186.152} cy={352.119} r={112.14} fill="#FFFFFF" />
            </G>

            {/* 7. Arms by Pose */}
            {/* Pose 1: Scratch Head (Matches UI Reference Frame 1) */}
            {currentPose === 'scratch' && (
              <G>
                {/* Left chubby arm resting at the side */}
                <Path
                  d="M74 135C58 148 54 176 68 192C80 206 102 198 108 182L122 148Z"
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.5}
                />
                {/* Right arm reaching up to scratch head */}
                <Path
                  d="M260 148C296 156 322 136 314 102C308 80 282 66 258 76C244 82 246 102 260 106C275 110 284 122 278 135C272 146 256 148 246 150Z"
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.5}
                />
                {/* Rounded paw/hand resting on temple */}
                <Ellipse
                  cx={258}
                  cy={88}
                  rx={15}
                  ry={13}
                  transform="rotate(18 258 88)"
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.5}
                />
              </G>
            )}

            {/* Pose 2: Shy / Clasping Hands (Matches UI Reference Frame 2) */}
            {currentPose === 'shy' && (
              <G>
                {/* Left arm curving inward to chest */}
                <Path
                  d="M92 148C86 166 98 186 118 192C138 198 162 188 178 176C174 163 162 156 148 158C128 160 110 146 92 148Z"
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.5}
                />
                {/* Right arm curving inward to chest */}
                <Path
                  d="M280 148C286 166 274 186 254 192C234 198 210 188 194 176C198 163 210 156 224 158C244 160 262 146 280 148Z"
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.5}
                />
                {/* Clasped chubby hands meeting at chest */}
                <Ellipse
                  cx={173}
                  cy={174}
                  rx={15}
                  ry={12}
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.5}
                />
                <Ellipse
                  cx={199}
                  cy={174}
                  rx={15}
                  ry={12}
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.5}
                />
              </G>
            )}

            {/* Pose 3: Thumbs Up & Cheering (Matches UI Reference Frame 3) */}
            {currentPose === 'thumbsUp' && (
              <G>
                {/* Viewer's Left Arm: Organic cartoon thumbs-up mitten hand matching reference */}
                <Path
                  d="M 98 172 C 85 178 68 172 58 160 C 50 150 52 132 56 116 C 58 102 62 90 70 88 C 74 87 79 88 81 93 C 83 100 81 110 81 118 C 86 120 98 122 104 134 C 108 144 104 156 98 166 C 96 169 94 171 98 172 Z"
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
                {/* Gentle natural palm/thumb fold line */}
                <Path
                  d="M 81 118 Q 88 124 96 123"
                  stroke="#D89B1C"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Viewer's Right Arm extending outward cheerfully */}
                <Path
                  d="M 272 142 C 295 146 322 156 338 166 C 348 172 346 186 334 187 C 316 185 292 174 266 168 Z"
                  fill="#F5C857"
                  stroke="#D89B1C"
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
              </G>
            )}

            {/* 8. Eyebrows */}
            {currentPose === 'scratch' && (
              <G>
                {/* Left eyebrow raised/questioning */}
                <Path
                  d="M151.955 62.5051L131.281 69.8175C126.832 71.3911 127.239 74.0388 128.385 78.6821C129.303 82.3968 133.738 81.7056 135.84 80.8956C141.038 79.3211 152.775 75.8461 158.138 74.5425C163.501 73.239 162.466 68.1108 161.279 65.7097C159.335 60.6636 154.253 61.4707 151.955 62.5051Z"
                  fill="#F5C857"
                  stroke="#FFEE91"
                  strokeWidth={13}
                />
                {/* Right eyebrow tilted */}
                <Path
                  d="M218.128 62.5488L238.096 71.6141C242.393 73.5649 241.76 76.1678 240.217 80.6951C238.983 84.3169 234.625 83.2465 232.6 82.2586C227.557 80.2423 216.163 75.7697 210.932 74.0093C205.701 72.2488 207.173 67.2288 208.563 64.9388C210.934 60.0788 215.928 61.3205 218.128 62.5488Z"
                  fill="#F5C857"
                  stroke="#FFEE91"
                  strokeWidth={13}
                />
              </G>
            )}

            {currentPose === 'shy' && (
              <G>
                {/* Soft, gentle curved eyebrows */}
                <G transform="translate(138, 70) rotate(-6)">
                  <Rect
                    x={-22}
                    y={-7}
                    width={44}
                    height={14}
                    rx={7}
                    fill="#F5C857"
                    stroke="#FFEE91"
                    strokeWidth={4}
                  />
                </G>
                <G transform="translate(234, 70) rotate(6)">
                  <Rect
                    x={-22}
                    y={-7}
                    width={44}
                    height={14}
                    rx={7}
                    fill="#F5C857"
                    stroke="#FFEE91"
                    strokeWidth={4}
                  />
                </G>
              </G>
            )}

            {currentPose === 'thumbsUp' && (
              <G>
                {/* Left eyebrow arched high */}
                <Path
                  d="M150 56L129 64C125 66 125 69 126 73C127 77 131 77 133 76C138 74 150 70 156 68C162 66 160 61 159 58C157 53 152 54 150 56Z"
                  fill="#F5C857"
                  stroke="#FFEE91"
                  strokeWidth={13}
                />
                {/* Right eyebrow angled playfully over winking eye */}
                <G transform="translate(232, 72) rotate(14)">
                  <Rect
                    x={-22}
                    y={-7}
                    width={44}
                    height={14}
                    rx={7}
                    fill="#F5C857"
                    stroke="#FFEE91"
                    strokeWidth={4}
                  />
                </G>
              </G>
            )}

            {/* 9. Eyes & Natural Blinking */}
            {/* Pose 1: Both Eyes Open (with natural blink) */}
            {currentPose === 'scratch' && (
              isBlinking ? (
                // Natural blink slit
                <G>
                  <Path
                    d="M 136 100 Q 154 108 172 100"
                    stroke="#363B43"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Path
                    d="M 200 100 Q 218 108 236 100"
                    stroke="#363B43"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    fill="none"
                  />
                </G>
              ) : (
                <G>
                  {/* Left Eye */}
                  <Ellipse
                    cx={154.35}
                    cy={96.65}
                    rx={21.45}
                    ry={21.42}
                    fill="#FAFAFA"
                  />
                  <Ellipse
                    cx={160.33}
                    cy={104.77}
                    rx={7.79}
                    ry={7.78}
                    fill="#363B43"
                  />
                  <Path
                    d="M163.567 110.493C162.698 108.536 164.462 106.436 166.542 106.952C168.391 107.41 169.119 109.644 167.895 111.102C166.67 112.559 164.34 112.231 163.567 110.493Z"
                    fill="#FAFAFA"
                  />

                  {/* Right Eye */}
                  <Ellipse
                    cx={218.38}
                    cy={96.65}
                    rx={21.45}
                    ry={21.42}
                    fill="#FAFAFA"
                  />
                  <Ellipse
                    cx={211.91}
                    cy={104.77}
                    rx={7.79}
                    ry={7.78}
                    fill="#363B43"
                  />
                  <Path
                    d="M205.439 111.907C203.664 110.708 204.046 107.99 206.084 107.327C207.894 106.737 209.695 108.247 209.429 110.131C209.164 112.016 207.016 112.972 205.439 111.907Z"
                    fill="#FAFAFA"
                  />
                </G>
              )
            )}

            {/* Pose 2: Closed Happy Eyes U  U (Middle UI Screenshot) */}
            {currentPose === 'shy' && (
              <G>
                {/* Left closed eye arc */}
                <Path
                  d="M 141 96 C 141 118, 167 118, 167 96"
                  stroke="#363B43"
                  strokeWidth={5}
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Right closed eye arc */}
                <Path
                  d="M 205 96 C 205 118, 231 118, 231 96"
                  stroke="#363B43"
                  strokeWidth={5}
                  strokeLinecap="round"
                  fill="none"
                />
              </G>
            )}

            {/* Pose 3: Left Eye Open, Right Eye Winking > (Right UI Screenshot) */}
            {currentPose === 'thumbsUp' && (
              <G>
                {/* Left Eye: Open & Happy (blinks naturally) */}
                {isBlinking ? (
                  <Path
                    d="M 136 100 Q 154 108 172 100"
                    stroke="#363B43"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : (
                  <G>
                    <Ellipse
                      cx={154.35}
                      cy={96.65}
                      rx={21.45}
                      ry={21.42}
                      fill="#FAFAFA"
                    />
                    <Ellipse
                      cx={160.33}
                      cy={104.77}
                      rx={7.79}
                      ry={7.78}
                      fill="#363B43"
                    />
                    <Path
                      d="M163.567 110.493C162.698 108.536 164.462 106.436 166.542 106.952C168.391 107.41 169.119 109.644 167.895 111.102C166.67 112.559 164.34 112.231 163.567 110.493Z"
                      fill="#FAFAFA"
                    />
                  </G>
                )}

                {/* Right Eye: WINKING! (">" chevron) */}
                <Path
                  d="M 206 95 L 223 103 L 206 111"
                  stroke="#363B43"
                  strokeWidth={5.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </G>
            )}

            {/* 10. Cheeks Blush */}
            {currentPose === 'shy' ? (
              // Rosy blush for shy pose
              <G>
                <Ellipse
                  cx={126}
                  cy={127}
                  rx={15}
                  ry={8}
                  transform="rotate(-12 126 127)"
                  fill="#FF7A60"
                  fillOpacity={0.38}
                />
                <Ellipse
                  cx={246}
                  cy={127}
                  rx={15}
                  ry={8}
                  transform="rotate(12 246 127)"
                  fill="#FF7A60"
                  fillOpacity={0.38}
                />
              </G>
            ) : (
              // Standard cheek marks
              <G>
                <Rect
                  width={20.95}
                  height={11.28}
                  rx={5.64}
                  transform="matrix(-0.902 -0.431 -0.432 0.902 129.5 126.3)"
                  fill="#2F2E41"
                  fillOpacity={0.12}
                />
                <Rect
                  width={20.95}
                  height={11.28}
                  rx={5.64}
                  transform="matrix(0.944 -0.331 0.332 0.943 243.1 125.9)"
                  fill="#2F2E41"
                  fillOpacity={0.12}
                />
              </G>
            )}

            {/* 11. Mouth by Pose */}
            {currentPose === 'scratch' && (
              // Small cute beak talking/curious
              <Path
                d="M186.958 118.952C181.883 118.952 173 118 173 118C173 118 174.745 144.331 186.959 144.014C199.172 143.696 201.076 118 201.076 118C201.076 118 192.034 118.952 186.958 118.952Z"
                fill="#E2852E"
              />
            )}

            {currentPose === 'shy' && (
              // Sweet gentle smile
              <G>
                <Path
                  d="M 179 125 Q 186 132 193 125"
                  stroke="#E2852E"
                  strokeWidth={4.2}
                  strokeLinecap="round"
                  fill="none"
                />
                <Ellipse cx={186} cy={122} rx={6} ry={4} fill="#E2852E" />
              </G>
            )}

            {currentPose === 'thumbsUp' && (
              // Wide open happy laughing smile
              <G>
                <Path
                  d="M 173 117 Q 186 114 199 117 C 199 137 173 137 173 117 Z"
                  fill="#E2852E"
                />
                <Path
                  d="M 176 122 Q 186 120 196 122 C 196 134 176 134 176 122 Z"
                  fill="#A63810"
                />
                <Path
                  d="M 180 127 Q 186 124 192 127 C 192 133 180 133 180 127 Z"
                  fill="#FF8A80"
                />
              </G>
            )}
          </Svg>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
