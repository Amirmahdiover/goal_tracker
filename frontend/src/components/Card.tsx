import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "section" | "article" | "div";
  variant?: "default" | "soft" | "danger" | "hero";
};

export function Card({
  as: Element = "section",
  children,
  className = "",
  variant = "default",
  ...props
}: CardProps) {
  return (
    <Element className={`card card-${variant} ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
}
