import tw from 'twin.macro';
import { Fragment, h } from 'preact';
import { WalletMultiButton } from '../components/wallet-adapter/ui/WalletMultiButton';
import { useContext } from 'preact/hooks';
import { GlobalsContext } from '../AppContext';

const Main = () => {
  const { widgetOpen } = useContext(GlobalsContext);

  const styles = {
    container: tw`relative`,
  };

  return (
    <Fragment>
      {widgetOpen && (
        <div css={styles.container}>
          <WalletMultiButton />
        </div>
      )}
    </Fragment>
  );
};

export default Main;
