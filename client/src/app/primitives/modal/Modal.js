/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';

import classNames from 'classnames';

import css from './Modal.less';


class Modal extends PureComponent {
  constructor(props) {
    super(props);
    this.modalRoot = document.getElementById('modal-root');
    this.container = document.createElement('div');
  }

  componentDidMount() {
    this.modalRoot.appendChild(this.container);
  }

  componentWillUnmount() {
    this.modalRoot.removeChild(this.container);
  }

  render() {
    return ReactDOM.createPortal(
      <div className={ css.ModalOverlay } onClick={ this.handleBackgroundClick }>
        <div className={ classNames(css.ModalContainer, this.props.className) }>
          { this.props.children }
        </div>
      </div>,
      this.container
    );
  }

  handleBackgroundClick = event => {
    if (event.target === event.currentTarget) {
      this.props.onClose();
    }
  };
}

Modal.defaultProps = {
  onClose: () => {}
};

export default Modal;
