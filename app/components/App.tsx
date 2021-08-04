import React from 'react';
import { Global, css } from '@emotion/react';
import styled from '@emotion/styled';
import { Provider } from 'react-redux';
import Entry from './Entry';
import Items from './Items';
import store from '../store';

import { DARK_GRAY, WHITE } from '../styles';

const globalStyles = css`
  *,
  *:before,
  *:after {
    box-sizing: border-box;
    font-family: Helvetica, Arial, Sans-Serif;
    position: relative;
  }

  body {
    margin: 0;
    overflow: hidden;
    padding: 0;
  }
`;

const Main = styled.main`
  background-color: rgb(242, 215, 191);
  color: ${DARK_GRAY};
  height: 100vh;
  overflow: auto;
  margin: 0;
  width: 100vw;
`;

const Headline = styled.h1`
  font-size: 48px;
  font-weight: normal;
  text-align: center;
`;

const Card = styled.section`
  background-color: ${WHITE};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  margin: auto;
  max-width: 800px;
  min-width: 400px;
  padding: 20px;
  width: 50%;
`;

export default function App() {
  return (
    <Provider store={store}>
      <Global styles={globalStyles} />
      <Main>
        <Headline>Yet another todo app!</Headline>

        <Card>
          <Entry />
          <Items />
        </Card>
      </Main>
    </Provider>
  );
}
