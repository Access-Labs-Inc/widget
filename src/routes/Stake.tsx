import tw from 'twin.macro';
import { h } from 'preact';
import { Header } from '../components/Header';
import { RouteLink } from '../layout/Router';

const styles = {
  cancel_link: tw`self-end cursor-pointer text-blue-400 no-underline`,
};

export const Stake = () => (
  <div>
    <Header>
      <RouteLink href="/" css={styles.cancel_link}>
        Cancel
      </RouteLink>
    </Header>
  </div>
);
