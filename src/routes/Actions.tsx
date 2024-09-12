import { h } from "preact";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";

import { ConfigContext } from "../AppContext";
import { clsxp, formatPenyACSCurrency } from "../libs/utils";
import { RouteLink } from "../layout/Router";
import { Header } from "../components/Header";
import { useWallet } from "../components/wallet-adapter/useWallet";
import { useConnection } from "../components/wallet-adapter/useConnection";
import env from "../libs/env";
import { offchainBasicSubscriptionsSchema } from "../validations/subscriptions";
import { getUserACSBalance } from "../libs/program";

export const Actions = () => {
  const { poolId, classPrefix } = useContext(ConfigContext);
  const { publicKey, disconnect, disconnecting, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [stakedAmount, setStakedAmount] = useState<number | null>(null);
  const [bondsAmount, setBondsAmount] = useState<number | null>(null);
  const [foreverAmount, setForeverAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!(publicKey && connected)) {
      return;
    }
    (async () => {
      try {
        // Fetch balance using the old method
        const userBalance = await getUserACSBalance(
          connection,
          publicKey,
          env.PROGRAM_ID
        );
        setBalance(userBalance.toNumber());

        // Fetch other data from GO API
        const response = await fetch(
          `${env.GO_API_URL}/subscriptions/${publicKey.toBase58()}`
        );
        if (!response.ok) {
          console.log("ERROR: ", response.statusText);
          return;
        }

        const json = await response.json();
        const data = offchainBasicSubscriptionsSchema.parse(json);
        const { locked, bonds, forever } = data.reduce(
          (acc, item) => {
            if (item.pool === poolId) {
              return {
                locked: acc.locked + (item.locked ?? 0),
                bonds: acc.bonds + (item.bonds ?? 0),
                forever: acc.forever + (item?.forever ?? 0),
              };
            } else {
              return acc;
            }
          },
          {
            locked: 0,
            bonds: 0,
            forever: 0,
          }
        );

        setStakedAmount(locked ?? 0);
        setBondsAmount(bonds ?? 0);
        setForeverAmount(forever ?? 0);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    })();
  }, [publicKey, connected, poolId, connection]);

  const disconnectHandler = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }, [disconnect]);

  const hasUnlockableAmount = useMemo(() => {
    return (stakedAmount ?? 0) + (bondsAmount ?? 0) > 0;
  }, [stakedAmount, bondsAmount]);

  const openClaimPage = useCallback(() => {
    window.open("https://hub.accessprotocol.co", "_blank");
  }, []);

  return (
    <div className={clsxp(classPrefix, "actions_root")}>
      {connected && disconnecting && (
        <Header>
          <div className={clsxp(classPrefix, "actions_actions_disconnect")}>
            Disconnecting...
          </div>
        </Header>
      )}
      {connected && !disconnecting && (
        <Header>
          <div
            className={clsxp(classPrefix, "actions_actions_disconnect")}
            onClick={disconnectHandler}
          >
            Disconnect
          </div>
        </Header>
      )}

      <div className={clsxp(classPrefix, "actions_logo")}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.8221 47.17C30.5621 47.17 37.1321 43.48 40.1021 36.28V46H47.9321V24.13C47.9321 9.91 38.2121 0.369997 24.2621 0.369997C10.1321 0.369997 0.23207 10.18 0.23207 24.13C0.23207 38.8 11.2121 47.17 22.8221 47.17ZM24.1721 39.25C14.9921 39.25 8.87207 32.77 8.87207 23.77C8.87207 14.77 14.9921 8.29 24.1721 8.29C33.3521 8.29 39.4721 14.77 39.4721 23.77C39.4721 32.77 33.3521 39.25 24.1721 39.25Z"
            fill="#E7E5E4"
          />
        </svg>
      </div>

      <div>
        <div className={clsxp(classPrefix, "actions_staked_amount")}>
          <div>
            {formatPenyACSCurrency(
              (stakedAmount ?? 0) + (bondsAmount ?? 0) + (foreverAmount ?? 0)
            )}{" "}
            ACS locked
          </div>
        </div>
        <div className={clsxp(classPrefix, "actions_balance")}>
          {formatPenyACSCurrency(balance ?? 0)} ACS available
        </div>
      </div>

      <div className={clsxp(classPrefix, "actions_links_wrapper")}>
        <RouteLink
          className={clsxp(classPrefix, "actions_button")}
          href="/stake"
        >
          Lock
        </RouteLink>
        {hasUnlockableAmount ? (
          <RouteLink
            className={clsxp(classPrefix, "actions_button")}
            href="/unstake"
          >
            Unlock ACS
          </RouteLink>
        ) : (
          <span
            className={clsxp(
              classPrefix,
              "actions_button",
              "actions_button_disabled"
            )}
          >
            Unlock ACS
          </span>
        )}
        <button
          className={clsxp(classPrefix, "actions_button")}
          onClick={openClaimPage}
        >
          View on HUB
        </button>
      </div>
    </div>
  );
};
