declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';
  
  export interface SyntaxHighlighterProps {
    children: string;
    style?: any;
    language?: string;
    PreTag?: string | ComponentType<any>;
    [key: string]: any;
  }
  
  export const Prism: ComponentType<SyntaxHighlighterProps>;
  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const tomorrow: any;
}