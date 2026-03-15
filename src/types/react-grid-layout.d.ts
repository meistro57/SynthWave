declare module "react-grid-layout" {
  import type { ComponentType, ReactNode } from "react";

  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export type Layouts = Record<string, Layout[]>;

  type ItemCallback = (
    layout: Layout[],
    oldItem: Layout,
    newItem: Layout,
    placeholder: Layout,
    layouts: Layouts,
  ) => void;

  export interface ResponsiveProps {
    className?: string;
    style?: React.CSSProperties;
    width?: number;
    autoSize?: boolean;
    breakpoints?: Record<string, number>;
    cols?: Record<string, number>;
    layouts?: Layouts;
    margin?: [number, number];
    containerPadding?: [number, number];
    rowHeight?: number;
    draggableHandle?: string;
    compactType?: "vertical" | "horizontal" | null;
    resizeHandles?: Array<"s" | "w" | "e" | "n" | "sw" | "nw" | "se" | "ne">;
    onLayoutChange?: (layout: Layout[], layouts: Layouts) => void;
    onBreakpointChange?: (breakpoint: string, cols: number) => void;
    onDragStop?: ItemCallback;
    onResizeStop?: ItemCallback;
    children?: ReactNode;
  }

  export const Responsive: ComponentType<ResponsiveProps>;

  export function WidthProvider<P extends object>(
    component: ComponentType<P>,
  ): ComponentType<Omit<P, "width">>;
}
