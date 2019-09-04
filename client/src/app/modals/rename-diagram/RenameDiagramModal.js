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

import View from './View';

const defaultState = {
  success: '',
  error: ''
};

class RenameDiagramModal extends PureComponent {

  constructor(props) {
    super(props);

    this.state = defaultState;
  }

  validateDiagramName = name => {
    if (!name.length) {
      return 'Diagram name must not be void.';
    }
  }

  handleRename = (values, { setSubmitting }) => {
    this.props.onRename(values.diagramName);
    setSubmitting(false);
  }

  render() {

    const validators = {
      diagramName: this.validateDiagramName
    };

    return <View
      onClose={ this.props.onClose }
      onRename={ this.handleRename }

      success={ this.state.success }
      error={ this.state.error }
      validators={ validators }
    />;
  }

}

export default RenameDiagramModal;
