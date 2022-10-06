import tw from 'twin.macro';
import { h } from 'preact';
import { WalletMultiButton } from '../components/wallet-adapter/ui/WalletMultiButton';

const Main = () => {
  // const config = useContext(ConfigContext);
  // const { widgetOpen } = useContext(GlobalsContext);

  const styles = {
    container: tw`mx-10 bg-gray-500`,
  };

  return (
    <div css={styles.container}>
      <div>
        <div css={tw`text-white`}>
          <WalletMultiButton />
        </div>
      </div>
    </div>
  );
};

export default Main;
