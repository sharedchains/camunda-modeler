/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment, PureComponent } from 'react';

import {
  Modal
} from '../../app/primitives';

import css from './PrivacyPreferencesView.less';

import {
  PRIVACY_TEXT_FIELD,
  PRIVACY_POLICY_URL,
  LEARN_MORE_TEXT,
  PRIVACY_POLICY_TEXT,
  PREFERENCES_LIST,
  OK_BUTTON_TEXT,
  CANCEL_BUTTON_TEXT,
  TITLE,
  DEFAULT_VALUES
} from './constants';

class PrivacyPreferencesView extends PureComponent {
  constructor(props) {
    super(props);

    this.state = { ...props.preferences };
  }

  isEnabled = (key) => {
    const {
      preferences
    } = this.props;

    if (!preferences) {
      return DEFAULT_VALUES[key];
    }

    return preferences[key];
  }

  renderPreferences() {
    return PREFERENCES_LIST.map((item) => (
      <Fragment key={ item.key }>
        <input
          id={ item.key }
          type="checkbox"
          defaultChecked={ this.isEnabled(item.key) }
          onChange={ (event) => {
            this.setState({ [item.key]: event.target.checked });
          } } />
        <label htmlFor={ item.key }>
          <div className="checkboxLabel">{ item.title }</div>
          <div className="checkboxExplanation">{ item.explanation }</div>
        </label>
      </Fragment>
    ));
  }

  render() {

    const {
      onClose,
      onSaveAndClose,
      hasCancel
    } = this.props;

    return (
      <Modal className={ css.View }>

        <Modal.Title>{ TITLE }</Modal.Title>

        <Modal.Body>
          <div className="privacyTextField">
            <p>
              { PRIVACY_TEXT_FIELD }
            </p>
          </div>

          <div className="privacyPreferencesField">
            { this.renderPreferences() }
          </div>
          <div className="privacyMoreInfoField">
            <p>
              { LEARN_MORE_TEXT }
              <a href={ PRIVACY_POLICY_URL }>
                { PRIVACY_POLICY_TEXT }
              </a>
            </p>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="form-submit">
            <button className="btn btn-primary" type="submit" onClick={ () => {
              onSaveAndClose(this.state);
            } }>
              { OK_BUTTON_TEXT }
            </button>
            { hasCancel && (
              <button className="btn btn-secondary" type="submit" onClick={ onClose }>
                { CANCEL_BUTTON_TEXT }
              </button>
            ) }
          </div>
        </Modal.Footer>

      </Modal>
    );
  }
}

export default PrivacyPreferencesView;
