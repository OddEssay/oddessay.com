import { SketchBadge as Badge } from 'blackchalk';
import type { ComponentProps } from 'react';

export default function SketchBadge(props: ComponentProps<typeof Badge>) {
  return <Badge {...props}/>;
}
