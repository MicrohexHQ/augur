import React from 'react';

import { Helmet } from 'react-helmet';
import { ButtonActionType } from 'modules/types';
import { ReportingModalButton } from 'modules/reporting/common';
import UserRepDisplay from 'modules/reporting/containers/user-rep-display';

interface ReportingReportingProps {
  openReportingModal: ButtonActionType;
}
class ReportingReporting extends React.Component<ReportingReportingProps> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <section>
        <Helmet>
          <title>Reporting: Markets</title>
        </Helmet>
        <div>
          <ReportingModalButton
            text="Designated Reporting Quick Guide"
            action={this.props.openReportingModal}
          />
          <UserRepDisplay />
        </div>
      </section>
    );
  }
}

export default ReportingReporting;
