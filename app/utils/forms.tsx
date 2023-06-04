import * as Checkbox from "@radix-ui/react-checkbox";
import { Link } from "@remix-run/react";
import { clsx } from "clsx";
import React, { useId } from "react";

export type ListOfErrors = Array<string | null | undefined> | null | undefined;

export function ErrorList({
  id,
  errors,
}: {
  errors?: ListOfErrors;
  id?: string;
}) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className="space-y-1">
      {errorsToRender.map((e) => (
        <li key={e} className="text-xs text-accent-red ">
          {e}
        </li>
      ))}
    </ul>
  );
}

export function Field({
  labelProps,
  inputProps,
  errors,
  className,
}: {
  labelProps: Omit<JSX.IntrinsicElements["label"], "className">;
  inputProps: Omit<JSX.IntrinsicElements["input"], "className">;
  errors?: ListOfErrors;
  className?: string;
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={clsx(className)}>
      <input
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        placeholder=" "
        {...inputProps}
        className="h-16 w-full rounded-lg bg-gray-100 px-4 pt-4 text-body-xs caret-gray-400 outline-none focus:border-accent-purple disabled:bg-day-400"
      />
      {/* the label comes after the input so we can use the sibling selector in the CSS to give us animated label control in CSS only */}
      <label htmlFor={id} {...labelProps} />
      <div className="px-2 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  );
}

export function TextareaField({
  labelProps,
  textareaProps,
  errors,
  className,
}: {
  labelProps: Omit<JSX.IntrinsicElements["label"], "className">;
  textareaProps: Omit<JSX.IntrinsicElements["textarea"], "className">;
  errors?: ListOfErrors;
  className?: string;
}) {
  const fallbackId = useId();
  const id = textareaProps.id ?? textareaProps.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={clsx(className)}>
      <textarea
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        placeholder=" "
        {...textareaProps}
        className="h-48 w-full rounded-lg border border-day-400 bg-day-700 px-4 pt-8 text-body-xs caret-white outline-none focus:border-accent-purple disabled:bg-day-400"
      />
      {/* the label comes after the input so we can use the sibling selector in the CSS to give us animated label control in CSS only */}
      <label htmlFor={id} {...labelProps} />
      <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  );
}

export function CheckboxField({
  labelProps,
  buttonProps,
  errors,
}: {
  labelProps: Omit<JSX.IntrinsicElements["label"], "className">;
  buttonProps: Omit<
    React.ComponentPropsWithoutRef<typeof Checkbox.Root>,
    "type" | "className"
  > & {
    type?: string;
  };
  errors?: ListOfErrors;
}) {
  const fallbackId = useId();
  const id = buttonProps.id ?? buttonProps.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div>
      <div className="flex gap-2">
        <Checkbox.Root
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          {...buttonProps}
          type="button"
        >
          <Checkbox.Indicator className="h-4 w-4">
            <svg viewBox="0 0 8 8">
              <path
                d="M1,4 L3,6 L7,2"
                stroke="black"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label
          htmlFor={id}
          {...labelProps}
          className="text-body-xs text-day-200"
        />
      </div>
      <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  );
}

export function getButtonClassName({
  size,
  variant,
}: {
  size: "xs" | "sm" | "md" | "md-wide" | "pill";
  variant: "primary" | "secondary" | "outline";
}) {
  const baseClassName =
    "flex justify-center items-center rounded-full font-semibold outline-none transition-[background-color,color] duration-200 disabled:bg-day-500 disabled:text-day-200";
  const primaryClassName = "bg-indigo-600 text-white hover:bg-indigo-500";
  const secondaryClassName =
    "border-[1.5px] border-day-400 bg-day-700 hover:border-accent-purple focus:border-accent-purple active:border-accent-purple-lighter";
  const extraSmallClassName = "py-2 px-3 text-body-xs";
  const smallClassName = "px-10 py-[14px] text-body-xs";
  const outlineClassName =
    "border border-input hover:border-gray-900 hover:bg-gray-50 text-gray-700 ";
  const mediumClassName = "px-14 py-5 text-lg";
  const mediumWideClassName = "px-24 py-5 text-lg";
  const pillClassName = "px-12 py-3 leading-3";
  const className = clsx(baseClassName, {
    [primaryClassName]: variant === "primary",
    [secondaryClassName]: variant === "secondary",
    [outlineClassName]: variant === "outline",
    [extraSmallClassName]: size === "xs",
    [smallClassName]: size === "sm",
    [mediumClassName]: size === "md",
    [mediumWideClassName]: size === "md-wide",
    [pillClassName]: size === "pill",
  });
  return className;
}

export function Button({
  size,
  variant,
  status = "idle",
  ...props
}: React.ComponentPropsWithoutRef<"button"> &
  Parameters<typeof getButtonClassName>[0] & {
    status?: "pending" | "success" | "error" | "idle";
  }) {
  const companion = {
    pending: <span className="inline-block animate-spin">🌀</span>,
    success: <span>✅</span>,
    error: <span>❌</span>,
    idle: null,
  }[status];
  return (
    <button
      {...props}
      className={clsx(
        props.className,
        getButtonClassName({ size, variant }),
        "gap- flex justify-center"
      )}
    >
      <div>{props.children}</div>
      {companion ? <div className="ml-2">{companion}</div> : null}
    </button>
  );
}

export function ButtonLink({
  size,
  variant,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Link>, "className"> &
  Parameters<typeof getButtonClassName>[0]) {
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <Link {...props} className={getButtonClassName({ size, variant })} />;
}

export function LabelButton({
  size,
  variant,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"label">, "className"> &
  Parameters<typeof getButtonClassName>[0]) {
  return (
    <label
      {...props}
      className={clsx("cursor-pointer", getButtonClassName({ size, variant }))}
    />
  );
}
