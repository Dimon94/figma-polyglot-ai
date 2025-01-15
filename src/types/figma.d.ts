/// <reference types="@figma/plugin-typings" />

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
} 