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

import classnames from 'classnames';

import {
  Formik,
  Form,
  Field
} from 'formik';

import {
  Icon,
  Modal
} from '../../primitives';

import AuthTypes from './AuthTypes';

import css from './View.less';


const SUCCESS_HEADING = 'Deployment successful';
const ERROR_HEADING = 'Deployment failed';


class View extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {};
  }

  toggleDetails = () => {
    this.setState({
      deployOpen: !this.state.deployOpen
    });
  }

  render() {
    const {
      error,
      success,
      initialValues,
      onClose,
      onDeploy,
      validators,
      onFocusChange = noop
    } = this.props;

    const deployOpen = this.state.deployOpen;

    return (
      <Modal className={ css.View } onClose={ onClose }>
        <h2>Deploy Diagram</h2>

        <p className="intro">
          Specify deployment details and deploy this diagram to Camunda.
        </p>


        <Formik
          initialValues={ initialValues }
          onSubmit={ onDeploy }
        >
          {({ isSubmitting, values }) => (
            <React.Fragment>

              { isSubmitting && <Icon name={ 'loading' } className="loading" /> }

              { success && <DeploySuccess message={ success } /> }

              { error && <DeployError message={ error } /> }

              <Form className={ css.Form }>

                <fieldset>

                  <legend>
                    Deployment Details
                    <button
                      type="button"
                      className="toggle-details"
                      onClick={ this.toggleDetails }
                      title="Toogle Advanced Details"
                      disabled={ values['tenantId'] }
                    >
                      { (deployOpen || values['tenantId']) ? '-' : '+' }
                    </button>
                  </legend>

                  <div className="fields">
                    <Field
                      name="deploymentName"
                      validate={ validators.deploymentName }
                      component={ FormControl }
                      label="Name"
                      validated
                      autoFocus
                      onFocusChange={ onFocusChange }
                    />

                    { (deployOpen || values['tenantId']) && <Field
                      name="tenantId"
                      component={ FormControl }
                      label="Tenant ID"
                      onFocusChange={ onFocusChange }
                    /> }
                  </div>

                </fieldset>

                <fieldset label="Foo">

                  <legend>Endpoint Configuration</legend>

                  <div className="fields">
                    <Field
                      name="endpointUrl"
                      validate={ validators.endpointUrl }
                      component={ FormControl }
                      label="URL"
                      hint="Should point to a running Camunda Engine REST API endpoint."
                      validated
                      onFocusChange={ onFocusChange }
                    />

                    <div>
                      <label htmlFor="authType">Authentication</label>
                    </div>

                    <div>
                      <Field name="authType" component="select">
                        <option value={ AuthTypes.none } defaultValue>None</option>
                        <option value={ AuthTypes.basic }>HTTP Basic</option>
                        <option value={ AuthTypes.bearer }>Bearer token</option>
                      </Field>
                    </div>

                    { values.authType === AuthTypes.basic && (
                      <AuthBasic
                        validators={ validators }
                        onFocusChange={ onFocusChange }
                      />) }

                    { values.authType === AuthTypes.bearer && (
                      <AuthBearer
                        validators={ validators }
                        onFocusChange={ onFocusChange }
                      />) }
                  </div>
                </fieldset>

                <div className="form-submit">
                  <button
                    type="submit"
                    disabled={ isSubmitting }>
                    Deploy
                  </button>

                  <button
                    type="button"
                    onClick={ onClose }>
                    { success ? 'Close' : 'Cancel' }
                  </button>
                </div>
              </Form>

            </React.Fragment>
          )}
        </Formik>

      </Modal>
    );
  }

}

function FormControl({
  field,
  hint,
  label,
  onFocusChange,
  validated,
  form: { touched, errors, isSubmitting, submitCount },
  ...props
}) {
  const { name } = field;

  return (
    <React.Fragment>
      <div>
        <label htmlFor={ name }>{ label }</label>
      </div>

      <div>
        <input
          { ...field } { ...props }
          onFocus={ onFocusChange }
          onBlur={ compose(onFocusChange, field.onBlur) }
          disabled={ isSubmitting }
          className={ validated && classnames({
            valid: submitCount && !errors[name] && touched[name],
            invalid: submitCount && errors[name] && touched[name]
          }) }
        />

        { errors[name] && touched[name] && submitCount ? (
          <div className="hint error">{errors[name]}</div>
        ) : null}

        { hint ? (
          <div className="hint">{ hint }</div>
        ) : null }
      </div>
    </React.Fragment>
  );
}

function DeployError({ message }) {
  return (
    <div className="deploy-message error">
      <p>
        <strong>{ ERROR_HEADING }</strong>
      </p>
      <p>
        <span className="content">{ message }</span>
      </p>
    </div>
  );
}

function DeploySuccess({ message }) {
  return (
    <div className="deploy-message success">
      <p>
        <strong>{ SUCCESS_HEADING }</strong>
      </p>
      <p>
        <span className="content">{ message }</span>
      </p>
    </div>
  );
}

function AuthBasic({ onFocusChange, validators, ...props }) {
  return (
    <React.Fragment>
      <Field
        name="username"
        validate={ validators.username }
        component={ FormControl }
        label="Username"
        validated
        onFocusChange={ onFocusChange }
        { ...props }
      />

      <Field
        name="password"
        validate={ validators.password }
        component={ FormControl }
        label="Password"
        type="password"
        validated
        onFocusChange={ onFocusChange }
        { ...props }
      />
    </React.Fragment>
  );
}

function AuthBearer({ onFocusChange, validators, ...props }) {
  return (
    <Field
      name="bearer"
      validate={ validators.bearer }
      component={ FormControl }
      label="Token"
      validated
      onFocusChange={ onFocusChange }
      { ...props }
    />
  );
}

export default View;



// helpers //////
function compose(...handlers) {
  return function(...args) {
    handlers.forEach(handler => handler(...args));
  };
}

function noop() {}
