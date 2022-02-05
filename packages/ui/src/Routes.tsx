import {Route, Switch} from 'react-router-dom';

import AdapterOrExtensionManager from './components/adapters-extensions/AdapterOrExtensionManager';
import CreateGovernanceProposal from './pages/governance/CreateGovernanceProposal';
import CreateMembershipProposal from './pages/membership/CreateMembershipProposal';
import CreateTransferProposal from './pages/transfers/CreateTransferProposal';
import CreateTributeProposal from './pages/tributes/CreateTributeProposal';
import GetStarted from './pages/start/GetStarted';
import GovernanceProposalDetails from './pages/governance/GovernanceProposalDetails';
import GovernanceProposals from './pages/governance/GovernanceProposals';
import MemberProfile from './pages/members/MemberProfile';
import Members from './pages/members/Members';
import Membership from './pages/membership/Membership';
import MembershipDetails from './pages/membership/MembershipDetails';
import NotFound from './pages/subpages/NotFound';
import Redeem from './pages/redeem/Redeem';
import TransferDetails from './pages/transfers/TransferDetails';
import Transfers from './pages/transfers/Transfers';
import TributeDetails from './pages/tributes/TributeDetails';
import Tributes from './pages/tributes/Tributes';
import Movements from './pages/movement/Movements';
import CreateMovementProposal from './pages/movement/CreateMovementProposal';
import MovementDetails from './pages/movement/MovementDetails';
import UnagiiVaults from './pages/unagi/UnagiiVaults';
import CreateDepositUnagiiVault from './pages/unagi/CreateDepositUnagiiVault';
import CreateWithdrawUnagiiVault from './pages/unagi/CreateWithdrawUnagiiVault';
import UnagiiVaultsDetails from './pages/unagi/UnagiiVaultsDetails';

const proposalIdParameter: string = ':proposalId';

export default function Routes() {
  return (
    <Switch>
      {[
        // Index page
        <Route key="splash" exact path="/" render={() => <GetStarted />} />,
        <Route
          key="join"
          exact
          path="/join"
          render={() => <CreateMembershipProposal />}
        />,
        <Route
          key="membership"
          exact
          path="/membership"
          render={() => <Membership />}
        />,
        <Route
          key="membership-details"
          exact
          path={`/membership/${proposalIdParameter}`}
          render={() => <MembershipDetails />}
        />,
        <Route
          key="transfer"
          exact
          path="/transfer"
          render={() => <CreateTransferProposal />}
        />,
        <Route
          key="transfers"
          exact
          path="/transfers"
          render={() => <Transfers />}
        />,
        <Route
          key="transfer-details"
          exact
          path={`/transfers/${proposalIdParameter}`}
          render={() => <TransferDetails />}
        />,
        <Route
          key="tribute"
          exact
          path="/tribute"
          render={() => <CreateTributeProposal />}
        />,
        <Route
          key="tributes"
          exact
          path="/tributes"
          render={() => <Tributes />}
        />,
        <Route
          key="tribute-details"
          exact
          path={`/tributes/${proposalIdParameter}`}
          render={() => <TributeDetails />}
        />,
        <Route
          key="governance-proposal"
          exact
          path="/governance-proposal"
          render={() => <CreateGovernanceProposal />}
        />,
        <Route
          key="governance-proposals"
          exact
          path="/governance"
          render={() => <GovernanceProposals />}
        />,
        <Route
          key="governance-proposal-details"
          exact
          path={`/governance/${proposalIdParameter}`}
          render={() => <GovernanceProposalDetails />}
        />,
        <Route 
          key="movements"
          exact
          path="/movements"
          render={() => <Movements />}
        />,
        <Route 
          key="unagii-vaults"
          exact
          path="/unagii-vaults"
          render={() => <UnagiiVaults />}
        />,
        <Route 
          key="unagii-vaults-deposit"
          exact
          path="/unagii-vaults/deposit"
          render={() => <CreateDepositUnagiiVault />}
        />,
        <Route 
          key="unagii-vaults-withdraw"
          exact
          path="/unagii-vaults/withdraw"
          render={() => <CreateWithdrawUnagiiVault />}
        />,
        <Route
          key="unagii-vaults-details"
          exact
          path={`/unagii-vaults/${proposalIdParameter}`}
          render={() => <UnagiiVaultsDetails />}
        />,
        <Route 
          key="movement"
          exact
          path="/movement"
          render={() => <CreateMovementProposal />}
        />,
        <Route
          key="movement-details"
          exact
          path={`/movements/${proposalIdParameter}`}
          render={() => <MovementDetails />}
        />,
        <Route
          key="members"
          exact
          path="/members"
          render={() => <Members />}
        />,
        <Route
          key="member-profile"
          exact
          path="/members/:ethereumAddress"
          render={() => <MemberProfile />}
        />,
        <Route
          key="dao-manager"
          exact
          path="/dao-manager"
          render={() => <AdapterOrExtensionManager />}
        />,
        <Route key="redeem" exact path="/redeem" render={() => <Redeem />} />,
        // 404 component (note: does not redirect to a route to maintain original path)
        <Route key="no-match" component={NotFound} />,
      ]}
    </Switch>
  );
}
