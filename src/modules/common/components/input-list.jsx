import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import Input from 'modules/common/components/input';

import debounce from 'utils/debounce';

export default class InputList extends Component {
  // TODO -- Prop Validations
  static propTypes = {
    // className: PropTypes.string,
    list: PropTypes.array,
    // errors: PropTypes.array,
    listMinElements: PropTypes.number,
    // listMaxElements: PropTypes.number,
    // itemMaxLength: PropTypes.number,
    onChange: PropTypes.func,
    warnings: PropTypes.array
  };

  constructor(props) {
    super(props);

    this.state = {
      list: this.fillMinElements(this.props.list, this.props.listMinElements),
      warnings: []
    };

    this.clearWarnings = debounce(this.clearWarnings.bind(this), 3000);
    this.handleChange = this.handleChange.bind(this);
    this.fillMinElements = this.fillMinElements.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.warnings && this.props.warnings !== nextProps.warnings) {
      this.setState({ warnings: nextProps.warnings });
      this.clearWarnings();
    }
  }

  clearWarnings() {
    this.setState({ warnings: [] });
  }

  handleChange = (i, val) => {
    const newList = (this.state.list || []).slice();

    if ((!val || !val.length) && (!this.props.listMinElements || (i >= this.props.listMinElements - 1))) {
      newList.splice(i, 1);
    } else {
      newList[i] = val;
    }

    this.props.onChange(newList);

    this.setState({ list: newList });
  };

  fillMinElements = (list = [], minElements) => {
    let len;
    let i;
    let newList = list;
    if (minElements && list.length < minElements) {
      newList = newList.slice();
      len = minElements - newList.length - 1;
      for (i = 0; i < len; i++) {
        newList.push('');
      }
    }
    return newList;
  };

  render() {
    const p = this.props;
    const s = this.state;
    let list = s.list;

    if (!p.listMaxElements || list.length < p.listMaxElements) {
      list = list.slice();
      list.push('');
    }

    return (
      <div className={classNames('input-list', p.className)}>
        {list.map((item, i) => (
          <div key={i} className={classNames('item', { 'new-item': i === list.length - 1 && (!item || !item.length) })}>
            <Input
              type="text"
              maxLength={p.itemMaxLength}
              value={item}
              onChange={newValue => this.handleChange(i, newValue)}
            />
            <span
              className={classNames({
                'has-errors': p.errors && p.errors[i] && p.errors[i].length,
                'has-warnings': s.warnings && s.warnings[i] && s.warnings[i].length
              })}
            >
              {p.errors && p.errors[i]}
              {p.warnings && p.warnings[i]}
            </span>
          </div>
        ))}
      </div>
    );
  }
}
