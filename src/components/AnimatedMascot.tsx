import React, { useEffect, useState } from 'react';
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

export type MascotPose = 'wave' | 'scratch' | 'shy' | 'thumbsUp';

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
  isTalking?: boolean;
  enableBlink?: boolean;
  enableFloating?: boolean;
  onPress?: () => void;
}

export default function AnimatedMascot({
  width = 340,
  height,
  style,
  initialPose = 'wave',
  pose: controlledPose,
  onPoseChange,
  autoCycle = true,
  cycleInterval = 3000,
  enableTapToCycle = true,
  isTalking = false,
  enableBlink = true,
  enableFloating = true,
  onPress,
}: AnimatedMascotProps) {
  const calculatedHeight = height ?? width * (308 / 384);

  const [internalPose, setInternalPose] = useState<MascotPose>(initialPose);
  const currentPose = controlledPose ?? internalPose;

  const [isBlinking, setIsBlinking] = useState(false);
  const [talkFrame, setTalkFrame] = useState<0 | 1 | 2>(0); // 0: closed, 1: halfOpen, 2: wideOpen
  const [isTapped, setIsTapped] = useState(false);

  // Animation values using useState for React 19 safety
  const [floatAnim] = useState(() => new Animated.Value(0)); // -1 to 1 float cycle
  const [hopAnim] = useState(() => new Animated.Value(0));   // 0 to 1 on hop / pose switch
  const [poseScaleAnim] = useState(() => new Animated.Value(1)); // Micro-spring on pose change

  // 1. Idle Floating & Breathing Loop
  useEffect(() => {
    if (!enableFloating) return;

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    return () => floatLoop.stop();
  }, [enableFloating, floatAnim]);

  // 2. Natural Blinking Loop
  useEffect(() => {
    if (!enableBlink) return;

    let isMounted = true;
    let blinkTimer: ReturnType<typeof setTimeout>;

    const scheduleNextBlink = () => {
      const nextInterval = Math.random() * 2600 + 2600; // blink every 2.6s - 5.2s
      blinkTimer = setTimeout(() => {
        if (!isMounted) return;

        setIsBlinking(true);
        setTimeout(() => {
          if (isMounted) {
            setIsBlinking(false);
            scheduleNextBlink();
          }
        }, 130);
      }, nextInterval);
    };

    scheduleNextBlink();

    return () => {
      isMounted = false;
      clearTimeout(blinkTimer);
    };
  }, [enableBlink]);

  // 3. Dynamic Mouth Talking Animation (Actively opens and closes in natural speaking cadence)
  useEffect(() => {
    if (!isTalking) {
      return;
    }

    // Natural talking cadence sequence: closed -> half -> wide -> half -> closed -> wide ...
    const cadenceSequence: (0 | 1 | 2)[] = [1, 2, 1, 0, 2, 1, 0, 2, 1, 2];
    let stepIndex = 0;

    const talkTimer = setInterval(() => {
      stepIndex = (stepIndex + 1) % cadenceSequence.length;
      setTalkFrame(cadenceSequence[stepIndex]);
    }, 135);

    return () => {
      clearInterval(talkTimer);
    };
  }, [isTalking]);

  // 4. Auto-Cycle through all 4 official poses
  useEffect(() => {
    if (!autoCycle || controlledPose !== undefined) return;

    const poses: MascotPose[] = ['wave', 'scratch', 'shy', 'thumbsUp'];
    const cycleTimer = setInterval(() => {
      // Bouncy hop on pose switch
      Animated.sequence([
        Animated.timing(hopAnim, {
          toValue: 0.6,
          duration: 130,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(hopAnim, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();

      setInternalPose((prev) => {
        const nextIndex = (poses.indexOf(prev) + 1) % poses.length;
        const nextPose = poses[nextIndex];
        onPoseChange?.(nextPose);
        return nextPose;
      });
    }, cycleInterval);

    return () => clearInterval(cycleTimer);
  }, [autoCycle, cycleInterval, controlledPose, onPoseChange, hopAnim]);

  // 5. Pose Change Spring Pop
  useEffect(() => {
    poseScaleAnim.setValue(0.93);
    Animated.spring(poseScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [currentPose, poseScaleAnim]);

  // Handle Tap on Mascot
  const handlePress = () => {
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 900);

    // Joyful hop
    Animated.sequence([
      Animated.timing(hopAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
      Animated.spring(hopAnim, {
        toValue: 0,
        friction: 4.5,
        tension: 85,
        useNativeDriver: true,
      }),
    ]).start();

    if (enableTapToCycle && controlledPose === undefined) {
      const poses: MascotPose[] = ['wave', 'scratch', 'shy', 'thumbsUp'];
      const nextIndex = (poses.indexOf(currentPose) + 1) % poses.length;
      const nextPose = poses[nextIndex];
      setInternalPose(nextPose);
      onPoseChange?.(nextPose);
    }

    onPress?.();
  };

  // Interpolated animated values
  const floatTranslateY = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [4.5, 0, -5.5],
  });

  const floatScaleY = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.99, 1, 1.018],
  });

  const floatScaleX = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.012, 1, 0.988],
  });

  const hopTranslateY = hopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const hopRotate = hopAnim.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: ['0deg', '-3deg', '2.5deg', '0deg'],
  });

  const shadowScaleX = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.06, 1, 0.88],
  });

  const shadowOpacity = floatAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.28, 0.23, 0.16],
  });

  // Effective mouth state: if not talking, mouth is strictly closed (0)
  const currentTalkFrame = isTalking ? talkFrame : 0;

  return (
    <View style={[{ width, height: calculatedHeight, alignItems: 'center', justifyContent: 'center' }, style]}>
      <TouchableOpacity
        activeOpacity={0.96}
        onPress={handlePress}
        style={StyleSheet.absoluteFill}
      >
        {/* Unified Ground Shadow (Perfectly centered on master grid for all poses) */}
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
          <Svg width="100%" height="100%" viewBox="0 0 384 308">
            <Ellipse cx={192} cy={298.5} rx={97.5} ry={9.5} fill="#363636" />
          </Svg>
        </Animated.View>

        {/* Animated Mascot Body with Floating, Hopping, Squash & Stretch */}
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
                { scale: poseScaleAnim },
              ],
            },
          ]}
        >
          {/* =========================================================================
              POSE 1: WAVE / GREETING (Master 384x308 Frame, centered cx=192)
             ========================================================================= */}
          {currentPose === 'wave' && (
            <Svg width="100%" height="100%" viewBox="0 0 384 308" fill="none">
              <G transform="translate(5.848, 0)">
                {/* Left Cloud Ear */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M106.684 21.9022C106.906 17.936 110.193 14.7883 114.215 14.7883C116.99 14.7883 119.416 16.2875 120.726 18.5202C121.177 18.4376 121.635 18.3962 122.093 18.3965C126.258 18.3965 129.635 21.7729 129.635 25.9379C129.635 30.1028 126.258 33.4793 122.093 33.4793H114.552V33.4791H108.941C105.623 33.4791 102.934 30.7894 102.934 27.4713C102.934 24.9518 104.485 22.7945 106.684 21.9022Z" fill="#0F69FF" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M98.4289 16.7944C98.6999 11.9638 102.703 8.13013 107.601 8.13013C110.982 8.13013 113.936 9.95598 115.531 12.6754C116.081 12.5748 116.638 12.5243 117.197 12.5247C122.27 12.5247 126.382 16.637 126.382 21.7097C126.382 26.7824 122.27 30.8947 117.197 30.8947H108.012V30.8945H101.178C97.1373 30.8945 93.8613 27.6185 93.8613 23.5774C93.8613 20.5087 95.7503 17.8813 98.4289 16.7944Z" fill="#FFFFFF" />

                {/* Body Back Orange */}
                <Path d="M290.322 101.3C289.998 161.602 230.679 178.292 182.886 178.035C135.093 177.778 81.742 158.163 82.0538 100.18C82.3323 48.383 135.941 20.024 183.734 20.281C231.527 20.538 290.646 40.9988 290.322 101.3Z" fill="#E2852E" />

                {/* Body Highlight + Yellow Circle */}
                <Circle cx={186.152} cy={140.399} r={112.14} fill="#FFFFFF" fillOpacity={0.3} />
                <Circle cx={186.152} cy={140.848} r={112.14} fill="#F5C857" />

                {/* Standing Feet */}
                <Path d="M103.113 298.292C94.0901 275.034 110.381 263.681 119.654 260.912V231.008L165.518 242.638V298.292H103.113Z" fill="#F5C857" />
                <Path d="M263.809 298.292C272.832 275.034 256.541 263.681 247.268 260.912V231.008L201.404 242.638V298.292H263.809Z" fill="#F5C857" />

                {/* Belly Stripes */}
                <Mask id="mask_denis_wave" maskUnits="userSpaceOnUse" x={74} y={28} width={225} height={225}>
                  <Circle cx={186.152} cy={140.848} r={112.14} fill="#FFFFFF" />
                </Mask>
                <G mask="url(#mask_denis_wave)">
                  <Circle cx={186.152} cy={264.65} r={112.14} fill="#E2852E" />
                  <Circle cx={186.152} cy={284.387} r={112.14} fill="#F5C857" />
                  <Circle cx={186.152} cy={306.815} r={112.14} fill="#FFEE91" />
                  <Circle cx={186.152} cy={329.243} r={112.14} fill="#ABE0F0" />
                  <Circle cx={186.152} cy={352.119} r={112.14} fill="#FFFFFF" />
                </G>

                {/* Right Cloud Ear */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M248.128 34.957C248.348 31.0313 251.601 27.9158 255.582 27.9158C258.329 27.9158 260.73 29.3996 262.026 31.6095C262.473 31.5278 262.926 31.4868 263.38 31.4871C267.503 31.4871 270.845 34.829 270.845 38.9515C270.845 43.0739 267.503 46.4159 263.38 46.4159L255.916 46.4159L255.916 46.4157L250.362 46.4157C247.078 46.4157 244.416 43.7534 244.416 40.4693C244.416 37.9755 245.951 35.8402 248.128 34.957Z" fill="#0F69FF" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M252.293 28.1361C252.573 23.1397 256.713 19.1746 261.78 19.1746C265.276 19.1746 268.332 21.0631 269.982 23.8757C270.55 23.7717 271.127 23.7195 271.705 23.7199C276.951 23.7199 281.205 27.9733 281.205 33.22C281.205 38.4667 276.951 42.7201 271.705 42.7201L262.204 42.7201L262.204 42.7199L255.137 42.7199C250.957 42.7199 247.568 39.3316 247.568 35.1517C247.568 31.9778 249.522 29.2602 252.293 28.1361Z" fill="#FFFFFF" />

                {/* Left & Right Waving Arms */}
                <Path d="M46.0763 80.8365C39.8942 75.3415 30.9073 83.1261 27.1866 87.7053C18.9438 78.0883 10.5866 83.6982 7.43839 87.7053C-22.7851 133.041 46.3626 170.133 84.7143 183.012L93.3005 122.909L67.5418 113.464L46.0763 100.585C48.6521 96.2917 52.2584 86.3316 46.0763 80.8365Z" fill="#F5C857" />
                <Path d="M357.648 129.01C365.861 129.995 365.991 141.884 365.03 147.705C377.694 147.5 379.035 157.476 378.123 162.489C364.221 215.172 290.609 187.998 255.54 167.826L294.843 121.55L318.991 134.572L342.864 142.103C344.37 137.328 349.436 128.025 357.648 129.01Z" fill="#F5C857" />

                {/* Eyebrows */}
                <Path d="M151.955 62.5051L131.281 69.8175C126.832 71.3911 127.239 74.0388 128.385 78.6821C129.303 82.3968 133.738 81.7056 135.84 80.8956C141.038 79.3211 152.775 75.8461 158.138 74.5425C163.501 73.239 162.466 68.1108 161.279 65.7097C159.335 60.6636 154.253 61.4707 151.955 62.5051Z" fill="#F5C857" stroke="#FFEE91" strokeWidth={14.3544} />
                <Path d="M218.128 62.5488L238.096 71.6141C242.393 73.5649 241.76 76.1678 240.217 80.6951C238.983 84.3169 234.625 83.2465 232.6 82.2586C227.557 80.2423 216.163 75.7697 210.932 74.0093C205.701 72.2488 207.173 67.2288 208.563 64.9388C210.934 60.0788 215.928 61.3205 218.128 62.5488Z" fill="#F5C857" stroke="#FFEE91" strokeWidth={14.3544} />

                {/* Cheeks */}
                <Rect width={20.9516} height={11.2783} rx={5.63916} transform="matrix(-0.902148 -0.431427 -0.432287 0.901736 129.537 126.331)" fill={isTapped ? '#FF7A60' : '#2F2E41'} fillOpacity={isTapped ? 0.42 : 0.12} />
                <Rect width={20.9518} height={11.2782} rx={5.6391} transform="matrix(0.9436 -0.331087 0.331967 0.943291 243.1 125.955)" fill={isTapped ? '#FF7A60' : '#2F2E41'} fillOpacity={isTapped ? 0.42 : 0.12} />

                {/* Eyes & Blinking */}
                {isBlinking ? (
                  <G>
                    <Path d="M 136 96 C 144 107, 164 107, 172 96" stroke="#363B43" strokeWidth={4.8} strokeLinecap="round" fill="none" />
                    <Path d="M 200 96 C 208 107, 228 107, 236 96" stroke="#363B43" strokeWidth={4.8} strokeLinecap="round" fill="none" />
                  </G>
                ) : (
                  <G>
                    <Ellipse cx={21.4478} cy={21.4192} rx={21.4478} ry={21.4192} transform="matrix(0.999985 0.00539685 -0.0053573 0.999986 132.906 75.2329)" fill="#FAFAFA" />
                    <Ellipse cx={7.79026} cy={7.77986} rx={7.79026} ry={7.77986} transform="matrix(0.999986 0.00536986 -0.00538422 0.999985 152.543 96.9883)" fill="#363B43" />
                    <Path d="M163.567 110.493C162.698 108.536 164.462 106.436 166.542 106.952C168.391 107.41 169.119 109.644 167.895 111.102C166.67 112.559 164.34 112.231 163.567 110.493Z" fill="#FAFAFA" />
                    <Ellipse cx={21.4478} cy={21.4192} rx={21.4478} ry={21.4192} transform="matrix(0.999985 0.00539685 -0.0053573 0.999986 196.928 75.2329)" fill="#FAFAFA" />
                    <Ellipse cx={7.79026} cy={7.77986} rx={7.79026} ry={7.77986} transform="matrix(0.999986 0.00536986 -0.00538422 0.999985 204.117 96.9883)" fill="#363B43" />
                    <Path d="M205.439 111.907C203.664 110.708 204.046 107.99 206.084 107.327C207.894 106.737 209.695 108.247 209.429 110.131C209.164 112.016 207.016 112.972 205.439 111.907Z" fill="#FAFAFA" />
                  </G>
                )}

                {/* Animated Talking Mouth */}
                {currentTalkFrame === 0 && (
                  <Path d="M186.958 118.952C181.883 118.952 173 118 173 118C173 118 174.745 144.331 186.959 144.014C199.172 143.696 201.076 118 201.076 118C201.076 118 192.034 118.952 186.958 118.952Z" fill="#E2852E" />
                )}
                {currentTalkFrame === 1 && (
                  <G>
                    <Path d="M 176 118 Q 186.5 116 197 118 C 197 131 176 131 176 118 Z" fill="#E2852E" />
                    <Path d="M 178 121 Q 186.5 119 195 121 C 195 128 178 128 178 121 Z" fill="#942E0E" />
                    <Path d="M 180 124 Q 186.5 122 193 124 C 193 127 180 127 180 124 Z" fill="#FF8A7A" />
                  </G>
                )}
                {currentTalkFrame === 2 && (
                  <G>
                    <Path d="M 173 117 Q 186.5 113 200 117 C 200 139 173 139 173 117 Z" fill="#E2852E" />
                    <Path d="M 175 121 Q 186.5 118 198 121 C 198 136 175 136 175 121 Z" fill="#942E0E" />
                    <Path d="M 178 126 Q 186.5 123 195 126 C 195 134 178 134 178 126 Z" fill="#FF8A7A" />
                  </G>
                )}
              </G>
            </Svg>
          )}

          {/* =========================================================================
              POSE 2: SCRATCH HEAD / THINKING (Master 384x308 Frame, centered cx=192)
             ========================================================================= */}
          {currentPose === 'scratch' && (
            <Svg width="100%" height="100%" viewBox="0 0 384 308" fill="none">
              <G transform="translate(52.3047, 0) scale(0.970976)">
                {/* Left Cloud Ear */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M62.0264 22.557C62.2555 18.4722 65.6405 15.2305 69.7825 15.2305C72.6412 15.2305 75.1391 16.7744 76.488 19.0739C76.9527 18.9889 77.4242 18.9462 77.8966 18.9465C82.1861 18.9465 85.6634 22.4238 85.6634 26.7133C85.6634 31.0028 82.1861 34.4801 77.8966 34.4801H70.1297V34.4799H64.3514C60.9342 34.4799 58.1641 31.7098 58.1641 28.2926C58.1641 25.6978 59.7614 23.476 62.0264 22.557Z" fill="#0F69FF" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M53.5264 17.2966C53.8054 12.3215 57.9282 8.37329 62.973 8.37329C66.4546 8.37329 69.497 10.2537 71.1399 13.0544C71.7059 12.9508 72.2801 12.8989 72.8555 12.8992C78.0799 12.8992 82.315 17.1344 82.315 22.3588C82.315 27.5832 78.0799 31.8184 72.8555 31.8184H63.3958V31.8182H56.3581C52.1961 31.8182 48.8223 28.4443 48.8223 24.2823C48.8223 21.1219 50.7677 18.4159 53.5264 17.2966Z" fill="white" />

                {/* Body Back Orange */}
                <Path d="M251.154 104.329C250.82 166.433 189.728 183.621 140.506 183.357C91.2848 183.092 36.3389 162.891 36.66 103.175C36.9468 49.8294 92.1584 20.6227 141.38 20.8874C190.602 21.152 251.488 42.2244 251.154 104.329Z" fill="#E2852E" />

                {/* Body Highlight + Yellow Circle */}
                <Circle cx={143.871} cy={144.596} r={115.492} fill="white" fillOpacity={0.3} />
                <Circle cx={143.871} cy={145.058} r={115.492} fill="#F5C857" />

                {/* Feet */}
                <Path d="M58.3496 307.209C49.0574 283.255 65.8349 271.563 75.3852 268.712V237.914L122.62 249.891V307.209H58.3496Z" fill="#F5C857" />
                <Path d="M223.85 307.209C233.142 283.255 216.364 271.563 206.814 268.712V237.914L159.579 249.891V307.209H223.85Z" fill="#F5C857" />

                {/* Belly Stripes */}
                <Mask id="mask_denis_scratch" maskUnits="userSpaceOnUse" x={28} y={29} width={232} height={232}>
                  <Circle cx={143.871} cy={145.058} r={115.492} fill="#F5C857" />
                </Mask>
                <G mask="url(#mask_denis_scratch)">
                  <Circle cx={143.871} cy={272.562} r={115.492} fill="#E2852E" />
                  <Circle cx={143.871} cy={292.888} r={115.492} fill="#F5C857" />
                  <Circle cx={143.871} cy={315.987} r={115.492} fill="#FFEE91" />
                  <Circle cx={143.871} cy={339.085} r={115.492} fill="#ABE0F0" />
                  <Circle cx={143.871} cy={362.646} r={115.492} fill="white" />
                </G>

                {/* Right Cloud Ear */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M207.7 36.002C207.927 31.9589 211.277 28.7502 215.377 28.7502C218.206 28.7502 220.679 30.2784 222.014 32.5544C222.474 32.4703 222.94 32.428 223.408 32.4283C227.654 32.4283 231.095 35.8702 231.095 40.1159C231.095 44.3615 227.654 47.8034 223.408 47.8034L215.72 47.8034L215.72 47.8032L210.001 47.8032C206.619 47.8032 203.877 45.0613 203.877 41.679C203.877 39.1107 205.458 36.9116 207.7 36.002Z" fill="#0F69FF" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M211.989 28.977C212.277 23.8313 216.541 19.7476 221.759 19.7476C225.36 19.7476 228.507 21.6925 230.206 24.5893C230.792 24.4821 231.386 24.4284 231.981 24.4287C237.384 24.4287 241.765 28.8093 241.765 34.2129C241.765 39.6164 237.384 43.997 231.981 43.997L222.197 43.997L222.197 43.9967L214.917 43.9967C210.613 43.9967 207.123 40.5071 207.123 36.2023C207.123 32.9336 209.135 30.1347 211.989 28.977Z" fill="white" />

                {/* Eyes & Blinking */}
                {isBlinking ? (
                  <G>
                    <Path d="M 94 99 C 102 110, 122 110, 130 99" stroke="#363B43" strokeWidth={4.8} strokeLinecap="round" fill="none" />
                    <Path d="M 158 99 C 166 110, 186 110, 194 99" stroke="#363B43" strokeWidth={4.8} strokeLinecap="round" fill="none" />
                  </G>
                ) : (
                  <G>
                    <Ellipse cx={22.0889} cy={22.0595} rx={22.0889} ry={22.0595} transform="matrix(0.999985 0.00539685 -0.0053573 0.999986 89.0312 77.4819)" fill="#FAFAFA" />
                    <Ellipse cx={8.02313} cy={8.01243} rx={8.02313} ry={8.01243} transform="matrix(0.999986 0.00536986 -0.00538422 0.999985 109.256 99.8875)" fill="#363B43" />
                    <Path d="M120.611 113.796C119.716 111.781 121.533 109.618 123.676 110.149V110.149C125.58 110.621 126.329 112.922 125.068 114.423V114.423C123.807 115.924 121.407 115.586 120.611 113.796V113.796Z" fill="#FAFAFA" />
                    <Ellipse cx={22.0889} cy={22.0595} rx={22.0889} ry={22.0595} transform="matrix(0.999985 0.00539685 -0.0053573 0.999986 154.967 77.4819)" fill="#FAFAFA" />
                    <Ellipse cx={8.02313} cy={8.01243} rx={8.02313} ry={8.01243} transform="matrix(0.999986 0.00536986 -0.00538422 0.999985 162.371 99.8875)" fill="#363B43" />
                    <Path d="M163.732 115.252C161.903 114.017 162.297 111.218 164.396 110.535V110.535C166.26 109.928 168.115 111.483 167.842 113.424V113.424C167.568 115.364 165.356 116.349 163.732 115.252V115.252Z" fill="#FAFAFA" />
                  </G>
                )}

                {/* Eyebrows */}
                <Path d="M108.651 64.3736L87.3595 71.9046C82.7777 73.5252 83.1962 76.2521 84.3775 81.0342C85.3225 84.8599 89.8895 84.148 92.0549 83.3139C97.4084 81.6923 109.496 78.1134 115.019 76.7709C120.542 75.4284 119.477 70.1469 118.254 67.674C116.252 62.477 111.018 63.3083 108.651 64.3736Z" fill="#F5C857" stroke="#FFEE91" strokeWidth={14.2287} />
                <Path d="M176.802 64.4187L197.367 73.755C201.792 75.7641 201.14 78.4448 199.552 83.1074C198.281 86.8376 193.792 85.7351 191.707 84.7176C186.513 82.6411 174.778 78.0348 169.391 76.2217C164.004 74.4087 165.52 69.2386 166.951 66.8801C169.393 61.8748 174.536 63.1537 176.802 64.4187Z" fill="#F5C857" stroke="#FFEE91" strokeWidth={14.2287} />

                {/* Cheeks */}
                <Rect width={21.5779} height={11.6155} rx={5.80773} transform="matrix(-0.902148 -0.431427 -0.432287 0.901736 85.5625 130.107)" fill={isTapped ? '#FF7A60' : '#2F2E41'} fillOpacity={isTapped ? 0.42 : 0.12} />
                <Rect width={21.5781} height={11.6153} rx={5.80767} transform="matrix(0.9436 -0.331087 0.331967 0.943291 202.52 129.72)" fill={isTapped ? '#FF7A60' : '#2F2E41'} fillOpacity={isTapped ? 0.42 : 0.12} />

                {/* Left Arm at side */}
                <Path d="M5.90961 197.146C-14.316 170.869 27.1616 142.13 47.7618 129.813L71.6393 169.502C63.6801 173.608 51.9898 181.077 54.7432 190.111C57.0098 197.548 31.1916 229.992 5.90961 197.146Z" fill="#F5C857" stroke="#F5C857" strokeWidth={0.99124} />

                {/* Right Arm Scratching Head */}
                <Path d="M232.74 96.0095C259.234 116.202 241.777 134.692 234.257 143.649L232.037 184.128C245.937 186.973 269.353 182.613 285.993 140.207C307.474 85.4641 284.702 61.3153 260.573 48.2732C236.365 35.1893 199.623 70.7692 232.74 96.0095Z" fill="#F5C857" />
                <Rect x={226.861} y={143.672} width={22.6365} height={43.887} fill="#F5C857" />

                {/* Animated Mouth */}
                {currentTalkFrame === 0 && (
                  <Circle cx={144.862} cy={128.196} r={9.93233} fill="#E2852E" />
                )}
                {currentTalkFrame === 1 && (
                  <G>
                    <Ellipse cx={144.862} cy={128.196} rx={11} ry={8.5} fill="#E2852E" />
                    <Ellipse cx={144.862} cy={129} rx={8} ry={5.5} fill="#942E0E" />
                    <Ellipse cx={144.862} cy={131} rx={5.5} ry={3.5} fill="#FF8A7A" />
                  </G>
                )}
                {currentTalkFrame === 2 && (
                  <G>
                    <Ellipse cx={144.862} cy={129} rx={13} ry={11.5} fill="#E2852E" />
                    <Ellipse cx={144.862} cy={130} rx={10} ry={8} fill="#942E0E" />
                    <Ellipse cx={144.862} cy={133} rx={7} ry={5} fill="#FF8A7A" />
                  </G>
                )}
              </G>
            </Svg>
          )}

          {/* =========================================================================
              POSE 3: SHY / HANDS CLASPED (Master 384x308 Frame, perfectly centered cx=192)
             ========================================================================= */}
          {currentPose === 'shy' && (
            <Svg width="100%" height="100%" viewBox="0 0 384 308" fill="none">
              <G transform="translate(72.9733, 0) scale(1.043444)">
                {/* Left Cloud Ear */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M37.9105 20.9903C38.1237 17.1892 41.2736 14.1726 45.128 14.1726C47.788 14.1726 50.1125 15.6093 51.3677 17.7491C51.8002 17.67 52.2389 17.6303 52.6785 17.6305C56.6701 17.6305 59.9059 20.8664 59.9059 24.858C59.9059 28.8495 56.6701 32.0854 52.6785 32.0854H45.451V32.0852H40.074C36.8941 32.0852 34.3164 29.5074 34.3164 26.3275C34.3164 23.9129 35.8028 21.8455 37.9105 20.9903Z" fill="#0F69FF" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M30.0004 16.0953C30.2601 11.4658 34.0965 7.79175 38.791 7.79175C42.0308 7.79175 44.8619 9.54158 46.3907 12.1477C46.9174 12.0514 47.4517 12.003 47.9871 12.0033C52.8487 12.0033 56.7897 15.9444 56.7897 20.806C56.7897 25.6675 52.8487 29.6086 47.9871 29.6086H39.1844V29.6083H32.6355C28.7626 29.6083 25.623 26.4688 25.623 22.5958C25.623 19.655 27.4334 17.1369 30.0004 16.0953Z" fill="white" />

                {/* Body Back Orange */}
                <Path d="M224.977 127.5C224.615 196.388 161.091 195.997 110.367 195.718C59.643 195.439 4.62867 185.738 4.9768 119.5C5.28779 60.3272 60.5901 15.2228 111.314 15.5019C162.038 15.7809 225.339 58.6122 224.977 127.5Z" fill="#E2852E" />

                {/* Body Highlight + Yellow Circle */}
                <Circle cx={114.073} cy={134.554} r={107.471} fill="white" fillOpacity={0.3} />
                <Circle cx={114.073} cy={134.984} r={107.471} fill="#F5C857" />

                {/* Feet */}
                <Path d="M34.4911 285.873C25.8443 263.583 41.4566 252.703 50.3436 250.05V221.391L94.2981 232.536V285.873H34.4911Z" fill="#F5C857" />
                <Path d="M188.495 285.873C197.142 263.583 181.53 252.703 172.643 250.05V221.391L128.688 232.536V285.873H188.495Z" fill="#F5C857" />

                {/* Belly Stripes */}
                <Mask id="mask_denis_shy" maskUnits="userSpaceOnUse" x={6} y={27} width={216} height={216}>
                  <Circle cx={114.073} cy={134.984} r={107.471} fill="#F5C857" />
                </Mask>
                <G mask="url(#mask_denis_shy)">
                  <Circle cx={114.073} cy={253.632} r={107.471} fill="#E2852E" />
                  <Circle cx={114.073} cy={272.547} r={107.471} fill="#F5C857" />
                  <Circle cx={114.073} cy={294.041} r={107.471} fill="#FFEE91" />
                  <Circle cx={114.073} cy={315.535} r={107.471} fill="#ABE0F0" />
                  <Circle cx={114.073} cy={337.459} r={107.471} fill="white" />
                </G>

                {/* Right Cloud Ear */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M173.469 33.5015C173.681 29.7392 176.798 26.7534 180.613 26.7534C183.246 26.7534 185.547 28.1755 186.789 30.2934C187.217 30.2151 187.652 30.1758 188.087 30.176C192.038 30.176 195.24 33.3788 195.24 37.3297C195.24 41.2805 192.038 44.4833 188.087 44.4833L180.933 44.4833L180.933 44.4831L175.611 44.4831C172.464 44.4831 169.912 41.9317 169.912 38.7843C169.912 36.3943 171.383 34.3479 173.469 33.5015Z" fill="#0F69FF" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M177.459 26.9647C177.728 22.1763 181.696 18.3762 186.551 18.3762C189.902 18.3762 192.83 20.1861 194.412 22.8817C194.956 22.782 195.509 22.732 196.063 22.7323C201.091 22.7323 205.168 26.8086 205.168 31.8369C205.168 36.8652 201.091 40.9415 196.063 40.9415L186.958 40.9415L186.958 40.9413L180.185 40.9413C176.179 40.9413 172.932 37.694 172.932 33.6882C172.932 30.6464 174.804 28.042 177.459 26.9647Z" fill="white" />

                {/* Eyebrows */}
                <Path d="M81.2989 59.9028L61.4857 66.9108C57.2222 68.4188 57.6116 70.9564 58.7108 75.4063C59.5902 78.9663 63.8401 78.3039 65.8551 77.5277C70.8367 76.0187 82.0849 72.6883 87.2244 71.4391C92.3639 70.1898 91.3727 65.2752 90.2347 62.974C88.3718 58.138 83.5013 58.9115 81.2989 59.9028Z" fill="#F5C857" stroke="#FFEE91" strokeWidth={14.3544} />
                <Path d="M144.718 59.9447L163.854 68.6325C167.972 70.5021 167.365 72.9966 165.887 77.3355C164.705 80.8065 160.528 79.7806 158.587 78.8338C153.754 76.9015 142.834 72.6151 137.821 70.928C132.808 69.2408 134.219 64.4298 135.551 62.2351C137.823 57.5775 142.609 58.7675 144.718 59.9447Z" fill="#F5C857" stroke="#FFEE91" strokeWidth={14.3544} />

                {/* Rosy Cheeks */}
                <Rect width={20.0793} height={10.8088} rx={5.40438} transform="matrix(-0.902148 -0.431427 -0.432287 0.901736 59.8145 121.071)" fill="#FF7A60" fillOpacity={0.45} />
                <Rect width={20.0795} height={10.8086} rx={5.40432} transform="matrix(0.9436 -0.331087 0.331967 0.943291 168.648 120.711)" fill="#FF7A60" fillOpacity={0.45} />

                {/* Closed Smiling Eyes U U */}
                <Path d="M70.6942 82.5212C69.6852 92.4811 69.856 107.07 83.7907 106.577C98.0612 106.073 95.5284 92.1518 93.1189 81.7289" stroke="#363636" strokeWidth={4} strokeLinecap="round" />
                <Path d="M131.598 81.7181C129.6 91.5277 128.315 106.06 142.23 106.96C156.479 107.882 155.347 93.7776 153.989 83.1664" stroke="#363B43" strokeWidth={4} strokeLinecap="round" />

                {/* Clasped Arms in front of chest */}
                <Path d="M70.704 200.89C72.673 191.391 77.7194 172.483 82.1529 172.838C87.6948 173.282 129.395 173.94 110.227 146.118C94.8931 123.861 38.8487 152.74 12.7433 169.962C16.5618 184.271 31.4644 215.477 60.5272 225.824L70.704 200.89Z" fill="#F5C857" stroke="#F5C857" />
                <Path d="M155.533 200.239C153.503 190.319 148.274 170.578 143.588 170.973C137.731 171.466 93.6755 172.377 114.073 143.188C130.391 119.837 189.442 149.729 216.928 167.594C212.818 182.575 196.908 215.279 166.15 226.253L155.533 200.239Z" fill="#F5C857" stroke="#F5C857" />

                {/* Animated Mouth */}
                {currentTalkFrame === 0 && (
                  <Path d="M113.629 116.21C108.733 116.21 99.3047 111.555 99.3047 111.555C99.3047 111.555 101.848 119.984 113.629 119.937C125.411 119.89 127.247 111.555 127.247 111.555C127.247 111.555 118.526 116.21 113.629 116.21Z" fill="#E2852E" />
                )}
                {currentTalkFrame === 1 && (
                  <G>
                    <Path d="M 106 116 Q 114 114 122 116 C 122 126 106 126 106 116 Z" fill="#E2852E" />
                    <Path d="M 108 119 Q 114 117 120 119 C 120 124 108 124 108 119 Z" fill="#942E0E" />
                    <Path d="M 110 122 Q 114 120 118 122 C 118 124 110 124 110 122 Z" fill="#FF8A7A" />
                  </G>
                )}
                {currentTalkFrame === 2 && (
                  <G>
                    <Path d="M 103 115 Q 114 112 125 115 C 125 131 103 131 103 115 Z" fill="#E2852E" />
                    <Path d="M 105 118 Q 114 115 123 118 C 123 128 105 128 105 118 Z" fill="#942E0E" />
                    <Path d="M 108 123 Q 114 121 120 123 C 120 127 108 127 108 123 Z" fill="#FF8A7A" />
                  </G>
                )}
              </G>
            </Svg>
          )}

          {/* =========================================================================
              POSE 4: THUMBS UP / CHEERING (Master 384x308 Frame, centered cx=192)
             ========================================================================= */}
          {currentPose === 'thumbsUp' && (
            <Svg width="100%" height="100%" viewBox="0 0 384 308" fill="none">
              <G transform="translate(52.0926, -24.216) scale(1.027092)">
                {/* Left Cloud Ear */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M76.0039 25.6099C76.7646 21.8178 80.366 19.2367 84.2424 19.7906C86.9177 20.1729 89.0489 21.9519 90.0038 24.2843C90.45 24.2668 90.897 24.29 91.339 24.3534C95.3534 24.927 98.1426 28.6464 97.569 32.6608C96.9953 36.6751 93.276 39.4643 89.2617 38.8907L81.9929 37.852L81.993 37.8518L76.5853 37.0791C73.3873 36.6221 71.1653 33.6592 71.6223 30.4611C71.9693 28.0327 73.7613 26.1671 76.0039 25.6099Z" fill="#0F69FF" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M68.752 19.5501C69.6785 14.9315 74.0648 11.7878 78.786 12.4625C82.0444 12.9281 84.6401 15.0948 85.8031 17.9356C86.3466 17.9143 86.891 17.9425 87.4294 18.0197C92.3187 18.7184 95.7158 23.2484 95.0171 28.1377C94.3185 33.0269 89.7885 36.4241 84.8993 35.7254L76.0463 34.4603L76.0463 34.4601L69.4601 33.519C65.5651 32.9624 62.8588 29.3537 63.4154 25.4586C63.838 22.501 66.0206 20.2287 68.752 19.5501Z" fill="white" />

                {/* Kicked-up Left Foot & Grounded Right Foot */}
                <Path d="M65.6161 273.309C50.145 261.113 60.9048 240.241 68.2186 231.33L116.705 254.626L108.258 265.027C100.49 272.87 81.0873 285.505 65.6161 273.309Z" fill="#F5C857" stroke="#F5C857" />
                <Path d="M187.845 314.001C198.829 294.417 185.791 282.229 177.899 278.583L181.708 251.93L139.449 256.468L132.36 306.073L187.845 314.001Z" fill="#F5C857" />

                {/* Body Back Orange */}
                <Path d="M242.066 127.43C233.448 185.506 173.976 193.422 127.946 186.591C81.9174 179.761 33.1974 153.507 41.4839 97.665C48.8865 47.7791 104.463 27.8294 150.492 34.6597C196.521 41.49 250.684 69.3534 242.066 127.43Z" fill="#E2852E" />

                {/* Body Highlight + Yellow Circle (Rotated) */}
                <Circle cx={136.278} cy={150.767} r={109.182} transform="rotate(8.1325 136.278 150.767)" fill="white" fillOpacity={0.3} />
                <Circle cx={136.217} cy={151.199} r={109.182} transform="rotate(8.1325 136.217 151.199)" fill="#F5C857" />

                {/* Belly Stripes */}
                <Mask id="mask_denis_thumbs" maskUnits="userSpaceOnUse" x={27} y={42} width={219} height={219}>
                  <Circle cx={136.217} cy={151.199} r={109.182} transform="rotate(8.1325 136.217 151.199)" fill="#F5C857" />
                </Mask>
                <G mask="url(#mask_denis_thumbs)">
                  <Circle cx={119.165} cy={270.524} r={109.182} transform="rotate(8.1325 119.165 270.524)" fill="#E2852E" />
                  <Circle cx={116.448} cy={289.547} r={109.182} transform="rotate(8.1325 116.448 289.547)" fill="#F5C857" />
                  <Circle cx={113.358} cy={311.164} r={109.182} transform="rotate(8.1325 113.358 311.164)" fill="#FFEE91" />
                  <Circle cx={110.268} cy={332.781} r={109.182} transform="rotate(8.1325 110.268 332.781)" fill="#ABE0F0" />
                  <Circle cx={107.118} cy={354.83} r={109.182} transform="rotate(8.1325 107.118 354.83)" fill="white" />
                </G>

                {/* Right Cloud Ear */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M210.536 57.6743C211.289 53.9209 214.853 51.3661 218.69 51.9144C221.338 52.2928 223.447 54.0536 224.393 56.3622C224.834 56.3449 225.277 56.3678 225.714 56.4306C229.688 56.9984 232.448 60.6798 231.88 64.6531C231.313 68.6265 227.631 71.3873 223.658 70.8195L216.463 69.7914L216.463 69.7912L211.111 69.0263C207.946 68.574 205.746 65.6413 206.199 62.476C206.542 60.0724 208.316 58.2258 210.536 57.6743Z" fill="#0F69FF" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M215.489 51.6737C216.447 46.8965 220.984 43.645 225.867 44.3429C229.237 44.8244 231.922 47.0655 233.125 50.0037C233.687 49.9817 234.25 50.0108 234.807 50.0908C239.864 50.8134 243.378 55.4988 242.655 60.5558C241.933 65.6128 237.247 69.1265 232.19 68.4039L223.034 67.0954L223.034 67.0951L216.221 66.1217C212.193 65.546 209.394 61.8135 209.969 57.7849C210.407 54.7257 212.664 52.3755 215.489 51.6737Z" fill="white" />

                {/* Eyes: Left Eye Open + Right Eye Winking > */}
                {isBlinking ? (
                  <Path d="M 98 104 C 106 115, 126 115, 134 104" stroke="#363B43" strokeWidth={4.8} strokeLinecap="round" fill="none" />
                ) : (
                  <G>
                    <Ellipse cx={20.8821} cy={20.8543} rx={20.8821} ry={20.8543} transform="matrix(0.989166 0.146803 -0.146764 0.989172 93.9336 80.6238)" fill="#FAFAFA" />
                    <Ellipse cx={7.5848} cy={7.57468} rx={7.5848} ry={7.57468} transform="matrix(0.98917 0.146777 -0.146791 0.989168 109.865 104.297)" fill="#363B43" />
                    <Path d="M118.63 118.832C118.061 116.826 120.051 115.045 121.985 115.828V115.828C123.704 116.525 124.098 118.779 122.716 120.015V120.015C121.335 121.251 119.135 120.614 118.63 118.832V118.832Z" fill="#FAFAFA" />
                  </G>
                )}
                {/* Right eye winking chevron */}
                <Path d="M181.842 106.755L160.985 115.066L179.547 122.818" stroke="#363B43" strokeWidth={4.5} strokeLinecap="round" />

                {/* Eyebrows */}
                <Path d="M114.047 70.9797L93.1133 75.1802C88.6087 76.0841 88.6357 78.6921 89.1016 83.3254C89.4744 87.0321 93.8437 86.9767 95.9817 86.4856C101.209 85.6839 113 83.9511 118.348 83.4334C123.696 82.9156 123.406 77.8305 122.592 75.3526C121.414 70.2213 116.404 70.2993 114.047 70.9797Z" fill="#F5C857" stroke="#FFEE91" strokeWidth={7} />
                <Path d="M177.821 80.1363L195.818 91.6239C199.69 94.0959 198.722 96.5175 196.612 100.669C194.923 103.99 190.87 102.358 189.054 101.126C184.471 98.4884 174.105 92.6082 169.306 90.1911C164.507 87.7739 166.617 83.1381 168.272 81.1224C171.227 76.7647 175.869 78.6493 177.821 80.1363Z" fill="#F5C857" stroke="#FFEE91" strokeWidth={7} />

                {/* Cheeks */}
                <Rect width={20.399} height={10.9809} rx={5.49043} transform="matrix(-0.832045 -0.554709 -0.555502 0.831516 83.6484 129.409)" fill="#2F2E41" fillOpacity={0.12} />
                <Rect width={20.3992} height={10.9808} rx={5.49038} transform="matrix(0.980947 -0.194273 0.195188 0.980766 193.156 144.688)" fill="#2F2E41" fillOpacity={0.12} />

                {/* Left Arm: Thumbs Up Mitten */}
                <Path d="M52.4022 192.783C15.8403 199.023 7.74109 178.439 4.91762 168.481C2.33235 149.258 12.4987 137.716 14.2823 136.378C15.7091 135.308 19.4708 117.286 18.9728 103.555C22.317 98.7248 28.3424 85.7707 40.8134 95.5826C55.3146 106.992 28.3268 149.532 46.6083 133.036C64.8898 116.539 98.1047 184.982 52.4022 192.783Z" fill="#F5C857" stroke="#F5C857" />

                {/* Right Arm: Outstretched Cheer */}
                <Path d="M292.183 206.315C301.971 185.693 262.729 167.875 241.885 161.544V166.971L225.572 190.035L247.323 206.315L255.862 217.255C261.811 224.827 282.395 226.937 292.183 206.315Z" fill="#F5C857" stroke="#F5C857" />

                {/* Animated Mouth */}
                {currentTalkFrame === 0 && (
                  <Path d="M144.649 127.631C138.453 126.746 127.779 124.021 127.779 124.021C127.779 124.021 125.263 156.84 140.226 158.579C155.19 160.317 162.048 128.918 162.048 128.918C162.048 128.918 150.844 128.516 144.649 127.631Z" fill="#E2852E" />
                )}
                {currentTalkFrame === 1 && (
                  <G>
                    <Path d="M 132 126 Q 144 124 156 126 C 156 142 132 142 132 126 Z" fill="#E2852E" />
                    <Path d="M 135 129 Q 144 127 153 129 C 153 138 135 138 135 129 Z" fill="#942E0E" />
                    <Path d="M 137 132 Q 144 130 151 132 C 151 136 137 136 137 132 Z" fill="#FF8A7A" />
                  </G>
                )}
                {currentTalkFrame === 2 && (
                  <G>
                    <Path d="M 128 124 Q 144 121 160 124 C 160 156 128 156 128 124 Z" fill="#E2852E" />
                    <Path d="M 131 128 Q 144 125 157 128 C 157 151 131 151 131 128 Z" fill="#942E0E" />
                    <Path d="M 135 136 Q 144 133 153 136 C 153 148 135 148 135 136 Z" fill="#FF8A7A" />
                  </G>
                )}
              </G>
            </Svg>
          )}
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
