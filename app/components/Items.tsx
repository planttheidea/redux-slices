import React from 'react';
import styled from '@emotion/styled';
import { useSelector } from 'react-redux';
import Item from './Item';
import { todos } from '../store';

const { getItems } = todos;

const Container = styled.div`
  margin-top: 15px;
  width: 100%;
`;

const NoItems = styled.span`
  display: block;
  text-align: center;
  width: 100%;
`;

type Item = {
  value: string;
};

export default function Items() {
  const items = useSelector(getItems);

  return (
    <Container>
      {items.length ? (
        items.map((item) => <Item key={item.value} item={item} />)
      ) : (
        <NoItems>No items on the list yet!</NoItems>
      )}
    </Container>
  );
}
