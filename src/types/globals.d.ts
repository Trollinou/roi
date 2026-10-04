declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '@wordpress/blocks' {
  export function registerBlockType(name: string, settings: Record<string, unknown>): unknown;
}

declare module '@wordpress/block-editor' {
  export function useBlockProps(props?: Record<string, unknown>): Record<string, unknown>;
  export namespace useBlockProps {
    function save(props?: Record<string, unknown>): Record<string, unknown>;
  }
  export const InspectorControls: React.ComponentType<React.PropsWithChildren<unknown>>;
  export const BlockControls: React.ComponentType<React.PropsWithChildren<unknown>>;
}

declare module '@wordpress/components' {
  export const PanelBody: React.ComponentType<any>;
  export const TextControl: React.ComponentType<any>;
  export const ToggleControl: React.ComponentType<any>;
  export const SelectControl: React.ComponentType<any>;
  export const Button: React.ComponentType<any>;
  export const RangeControl: React.ComponentType<any>;
  export const CheckboxControl: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const ToolbarGroup: React.ComponentType<any>;
  export const ToolbarButton: React.ComponentType<any>;
}

declare module '@wordpress/element' {
  export {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    forwardRef,
    useImperativeHandle,
    createContext,
    useContext,
  } from 'react';
  export function render(element: React.ReactElement, container: HTMLElement): void;
  export function createRoot(container: HTMLElement): { render: (element: React.ReactElement) => void };
}

declare module '@wordpress/i18n' {
  export function __(text: string, domain?: string): string;
  export function _x(text: string, context: string, domain?: string): string;
  export function _n(single: string, plural: string, number: number, domain?: string): string;
  export function sprintf(format: string, ...args: unknown[]): string;
}

declare module '@wordpress/html-entities' {
  export function decodeEntities(html: string | null | undefined): string;
}

declare module '@wordpress/plugins' {
  export function registerPlugin(name: string, settings: { render: React.ComponentType<any>; [key: string]: unknown }): void;
}

declare module '@wordpress/interactivity' {
  export interface StoreConfig<TState = Record<string, any>, TActions = Record<string, any>, TCallbacks = Record<string, any>> {
    state?: TState;
    actions?: TActions;
    callbacks?: TCallbacks;
  }
  export function store<TState = Record<string, any>, TActions = Record<string, any>, TCallbacks = Record<string, any>>(
    namespace: string,
    config?: StoreConfig<TState, TActions, TCallbacks>
  ): {
    state: TState;
    actions: TActions;
    callbacks: TCallbacks;
  };
  export function getContext<TContext = Record<string, any>>(): TContext;
  export function getElement(): { ref: HTMLElement; attributes?: Record<string, unknown> };
  export function splitTask<T>(fn: () => T): Promise<T>;
}

declare module '@wordpress/editor' {
  export const PluginDocumentSettingPanel: React.ComponentType<any>;
}

declare module '@wordpress/edit-post' {
  export const PluginDocumentSettingPanel: React.ComponentType<any>;
}

declare module '@wordpress/data' {
  export function useSelect<T>(mapSelect: (select: any) => T, deps?: unknown[]): T;
  export function useDispatch(store?: string): any;
  export function select(store: string): any;
  export function dispatch(store: string): any;
  export function subscribe(listener: () => void): () => void;
}

declare namespace JSX {
  interface IntrinsicElements {
    'cg-board': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'piece': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

interface Window {
  wp?: any;
  YT?: any;
  onYouTubeIframeAPIReady?: () => void;
  EgBoardCore?: any;
  RoiFenEditor?: any;
  RoiPgnEditor?: any;
  getFinalFenFromPgn?: any;
  roiSuiviConfig?: {
    apiUrl?: string;
    nonce?: string;
    [key: string]: unknown;
  };
  roiApprentissageConfig?: {
    apiUrl?: string;
    nonce?: string;
    [key: string]: unknown;
  };
}
