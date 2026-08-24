import { Slot } from '@radix-ui/react-slot';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { cn } from '../../lib/utils';
import { Label } from './label';

type FormFieldContextValue = { name: string };
type FormItemContextValue = { id: string };

const FormFieldContext = createContext<FormFieldContextValue>({ name: '' });
const FormItemContext = createContext<FormItemContextValue>({ id: '' });

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;
  const { error, invalid } = fieldState;

  return {
    id,
    name: fieldContext.name,
    formItemId: id + '-form-item',
    formDescriptionId: id + '-form-item-description',
    formMessageId: id + '-form-item-message',
    error,
    invalid,
  };
};

/** Provider gốc của mọi form — bọc trực tiếp react-hook-form FormProvider. */
const Form = FormProvider;

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}
FormField.displayName = 'FormField';

function FormItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-testid="form-item" className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}
FormItem.displayName = 'FormItem';

const FormLabel = forwardRef<ElementRef<typeof Label>, ComponentPropsWithoutRef<typeof Label>>(
  ({ className, ...props }, ref) => {
    const { error, formItemId } = useFormField();

    return (
      <Label
        ref={ref}
        className={cn(error && 'text-destructive', className)}
        htmlFor={formItemId}
        {...props}
      />
    );
  },
);
FormLabel.displayName = 'FormLabel';

const FormControl = forwardRef<ElementRef<typeof Slot>, ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <Slot
        ref={ref}
        id={formItemId}
        aria-describedby={error ? formDescriptionId + ' ' + formMessageId : formDescriptionId}
        aria-invalid={!!error}
        {...props}
      />
    );
  },
);
FormControl.displayName = 'FormControl';

const FormDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return (
      <p
        ref={ref}
        id={formDescriptionId}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  },
);
FormDescription.displayName = 'FormDescription';

const FormMessage = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message ?? '') : children;

    if (!body) return null;

    return (
      <p
        ref={ref}
        data-testid="form-message"
        id={formMessageId}
        className={cn('text-sm font-medium text-destructive', className)}
        {...props}
      >
        {body}
      </p>
    );
  },
);
FormMessage.displayName = 'FormMessage';

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage };
