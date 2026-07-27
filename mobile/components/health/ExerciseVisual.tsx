import { useState } from 'react';
import { Image, type ImageSourcePropType, type LayoutChangeEvent, type StyleProp, View, type ViewStyle } from 'react-native';
import { palette } from '@luminary/design-system';
import { getWorkoutVisualPosition } from '@/lib/exerciseVisualManifest';

const atlases: ImageSourcePropType[] = [
  require('../../assets/exercises/atlas-01.png'),
  require('../../assets/exercises/atlas-02.png'),
  require('../../assets/exercises/atlas-03.png'),
  require('../../assets/exercises/atlas-04.png'),
  require('../../assets/exercises/atlas-05.png'),
  require('../../assets/exercises/atlas-06.png'),
  require('../../assets/exercises/atlas-07.png'),
  require('../../assets/exercises/atlas-08.png'),
  require('../../assets/exercises/atlas-09.png'),
  require('../../assets/exercises/atlas-10.png'),
  require('../../assets/exercises/atlas-11.png'),
  require('../../assets/exercises/atlas-12.png'),
];

type Props = {
  visualId: string;
  style?: StyleProp<ViewStyle>;
};

export function ExerciseVisual({ visualId, style }: Props) {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const position = getWorkoutVisualPosition(visualId);
  const cellSize = Math.max(frame.width, frame.height);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== frame.width || height !== frame.height) setFrame({ width, height });
  };

  return (
    <View onLayout={onLayout} style={[{ overflow: 'hidden', backgroundColor: palette.surfaceContainerHighest }, style]}>
      {cellSize > 0 ? (
        <Image
          accessible={false}
          source={atlases[position.atlas] ?? atlases[0]}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            width: cellSize * 4,
            height: cellSize * 4,
            left: -position.column * cellSize + (frame.width - cellSize) / 2,
            top: -position.row * cellSize + (frame.height - cellSize) / 2,
          }}
        />
      ) : null}
    </View>
  );
}
