import * as LabelPrimitive from '@radix-ui/react-label';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactElement,
} from 'react';

import { cn } from '../../lib/utils';

export type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

export const Label = forwardRef<ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, ...props }, ref): ReactElement => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = LabelPrimitive.Root.displayName;
