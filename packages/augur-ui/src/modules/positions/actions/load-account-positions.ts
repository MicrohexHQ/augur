import logError from 'utils/log-error';
import { updateTopBarPL } from 'modules/positions/actions/update-top-bar-pl';
import { updateLoginAccount } from 'modules/account/actions/login-account';
import { AppState } from 'store';
import { updateAccountPositionsData } from 'modules/positions/actions/account-positions';
import {
  AccountPositionAction,
  AccountPosition,
  NodeStyleCallback,
} from 'modules/types';
import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { augurSdk } from 'services/augursdk';
import { Getters } from '@augurproject/sdk';

interface UserTradingPositions {
  frozenFundsTotal: {
    frozenFunds: string;
  };
  tradingPositions: Getters.Users.TradingPosition[];
  tradingPositionsPerMarket: Getters.Users.MarketTradingPosition;
  tradingPositionsTotal?: Getters.Users.TradingPosition;
}

export const loadAllAccountPositions = (
  options: any = {},
  callback: NodeStyleCallback = logError,
  marketIdAggregator: Function | undefined
) => (dispatch: ThunkDispatch<void, any, Action>) => {
  dispatch(
    loadAccountPositionsInternal(
      options,
      (err: any, { marketIds = [], positions = {} }: any) => {
        if (marketIdAggregator) marketIdAggregator(marketIds);
        if (!err) postProcessing(marketIds, dispatch, positions, callback);
      }
    )
  );
};

export const loadMarketAccountPositions = (
  marketId: string,
  callback: NodeStyleCallback = logError
) => (dispatch: ThunkDispatch<void, any, Action>) => {
  dispatch(
    loadAccountPositionsInternal(
      { marketId },
      (err: any, { marketIds = [], positions = {} }: any) => {
        if (!err) postProcessing(marketIds, dispatch, positions, callback);
        dispatch(loadAccountPositionsTotals());
      }
    )
  );
};

export const loadAccountPositionsTotals = (
  callback: NodeStyleCallback = logError
) => async (
  dispatch: ThunkDispatch<void, any, Action>,
  getState: () => AppState
) => {
  const { universe, loginAccount } = getState();
  const Augur = augurSdk.get();
  const positions = await Augur.getProfitLossSummary({
    account: loginAccount.address,
    universe: universe.id,
  });
  dispatch(
    updateLoginAccount({
      totalFrozenFunds: positions[30].frozenFunds,
      tradingPositionsTotal: { unrealizedRevenue24hChangePercent : positions[1].unrealizedPercent },
    })
  );
};

const loadAccountPositionsInternal = (
  options: any = {},
  callback: NodeStyleCallback
) => async (
  dispatch: ThunkDispatch<void, any, Action>,
  getState: () => AppState
) => {
  const { universe, loginAccount } = getState();
  if (loginAccount.address == null || universe.id == null)
    return callback(null, {});
  const params = {
    ...options,
    account: loginAccount.address,
    universe: universe.id,
  };
  const Augur = augurSdk.get();
  const positions = await Augur.getUserTradingPositions(params);
  if (positions == null || positions.tradingPositions == null) {
    return callback(null, {});
  }

  if (!options.marketId) {
    dispatch(loadAccountPositionsTotals());
  }

  const marketIds = Array.from(
    new Set([
      ...positions.tradingPositions.reduce(
        (p: any, position: any) => [...p, position.marketId],
        []
      ),
    ])
  );

  if (marketIds.length === 0) return callback(null, {});
  callback(null, { marketIds, positions });
};

const postProcessing = (
  marketIds: Array<string>,
  dispatch: ThunkDispatch<void, any, Action>,
  positions: UserTradingPositions,
  callback: NodeStyleCallback
) => {
  marketIds.forEach((marketId: string) => {
    const marketPositionData: AccountPosition = {};
    const marketPositions = positions.tradingPositions.filter(
      (position: any) => position.marketId === marketId
    );
    const outcomeIds: Array<number> = Array.from(
      new Set([
        ...marketPositions.reduce(
          (p: Array<number>, position: Getters.Users.TradingPosition) => [
            ...p,
            position.outcome,
          ],
          []
        ),
      ])
    );
    marketPositionData[marketId] = {
      tradingPositions: {},
    };

    if (
      positions.tradingPositionsPerMarket &&
      positions.tradingPositionsPerMarket[marketId]
    ) {
      // @ts-ignore
      marketPositionData[marketId].tradingPositionsPerMarket =
        positions.tradingPositionsPerMarket[marketId];
    }

    outcomeIds.forEach((outcomeId: number) => {
      marketPositionData[marketId].tradingPositions[
        outcomeId
      ] = positions.tradingPositions.filter(
        (position: Getters.Users.TradingPosition) =>
          position.marketId === marketId && position.outcome === outcomeId
      )[0];
    });
    const positionData: AccountPositionAction = {
      marketId,
      positionData: marketPositionData,
    };
    dispatch(updateAccountPositionsData(positionData));
  });
  dispatch(updateTopBarPL());
  if (callback) callback(null, positions);
};
