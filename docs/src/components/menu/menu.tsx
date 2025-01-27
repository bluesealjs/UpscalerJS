import React, { MutableRefObject } from 'react';
import { CustomElement } from '@site/src/utils/customElement';
import { SlMenu } from '@shoelace-style/shoelace';

interface IProps {
  ref?: MutableRefObject<SlMenu>;
  children: JSX.Element | JSX.Element[];
}

export const Menu = (props: IProps) => {
  return (
    <sl-menu
      {...props}
    />
  );
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['sl-menu']: CustomElement<SlMenu>;
    }
  }
}

