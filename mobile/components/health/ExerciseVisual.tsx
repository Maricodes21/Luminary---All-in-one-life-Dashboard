import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { type LayoutChangeEvent, type StyleProp, View, type ViewStyle } from 'react-native';
import { palette } from '@luminary/design-system';
import { getWorkoutVisualPosition } from '@/lib/exerciseVisualManifest';

type Props = {
  visualId: string;
  style?: StyleProp<ViewStyle>;
};

export function ExerciseVisual({ visualId, style }: Props) {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [imageFailed, setImageFailed] = useState(false);
  const position = getWorkoutVisualPosition(visualId);
  const cellSize = Math.max(frame.width, frame.height);

  useEffect(() => setImageFailed(false), [position.atlas]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== frame.width || height !== frame.height) setFrame({ width, height });
  };

  return (
    <View onLayout={onLayout} style={[{ overflow: 'hidden', backgroundColor: palette.surfaceContainerHighest }, style]}>
      {cellSize > 0 && !imageFailed ? (
        <Image
          accessible={false}
          source={atlasSource(position.atlas)}
          contentFit="fill"
          cachePolicy="memory-disk"
          recyclingKey={`exercise-atlas-${position.atlas}`}
          transition={80}
          onError={() => setImageFailed(true)}
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

// Keep each bundled atlas behind a branch so opening one exercise does not eagerly
// resolve and decode the entire visual library.
function atlasSource(index: number) {
  switch (index) {
    case 1: return require('../../assets/exercises/atlas-02.png');
    case 2: return require('../../assets/exercises/atlas-03.png');
    case 3: return require('../../assets/exercises/atlas-04.png');
    case 4: return require('../../assets/exercises/atlas-05.png');
    case 5: return require('../../assets/exercises/atlas-06.png');
    case 6: return require('../../assets/exercises/atlas-07.png');
    case 7: return require('../../assets/exercises/atlas-08.png');
    case 8: return require('../../assets/exercises/atlas-09.png');
    case 9: return require('../../assets/exercises/atlas-10.png');
    case 10: return require('../../assets/exercises/atlas-11.png');
    case 11: return require('../../assets/exercises/atlas-12.png');
    default: return require('../../assets/exercises/atlas-01.png');
  }
}
