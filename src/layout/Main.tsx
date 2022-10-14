import tw from 'twin.macro';
import { Fragment, h } from 'preact';
import { WalletMultiButton } from '../components/wallet-adapter/ui/WalletMultiButton';

const Main = () => {
  const styles = {
    container: tw`relative`,
  };

  return (
    <Fragment>
      <div css={styles.container}>
        <WalletMultiButton />
      </div>
    </Fragment>
  );
};

export default Main;
