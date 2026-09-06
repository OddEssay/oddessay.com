import { SketchCard as Card } from 'blackchalk';
import type { ComponentProps } from 'react';

export default function SketchCard(props: ComponentProps<typeof Card>) {
  return <Card {...props}/>;
}
