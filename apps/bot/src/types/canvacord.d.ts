import type { Element } from 'canvacord';

declare module 'canvacord' {
  namespace JSX {
    function createElement(
      type: string | Element,
      props: Record<string, unknown>,
      ...children: (Element | string | (Element | string)[])[]
    ): Element;
  }
}
