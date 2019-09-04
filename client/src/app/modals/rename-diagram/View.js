import React, { PureComponent } from 'react';

import classnames from 'classnames';

import {
  Formik,
  Form,
  Field
} from 'formik';

import {
  Modal
} from '../../primitives';

import css from './View.less';


class View extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const {
      error,
      success,
      onClose,
      onRename,
      validators,
      onFocusChange = noop
    } = this.props;

    return (
      <Modal className={ css.View } onClose={ onClose }>
        <h2>Rename Diagram</h2>
        <Formik
          initialValues={{ diagramName: ''}}
          onSubmit={ onRename }
        >
        {({ isSubmitting, values }) => (
          <React.Fragment>

            <Form className={ css.Form }>

              <fieldset>

                <div className="fields">
                  <Field
                    name="diagramName"
                    validate={ validators.validateDiagramName }
                    component={ FormControl }
                    label="Name"
                    validated
                    autoFocus
                    onFocusChange={ onFocusChange }
                  />
                </div>

              </fieldset>

              <div className="form-submit">
                <button
                  type="submit"
                  disabled={ isSubmitting }>
                  Rename
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

export default View;

function compose(...handlers) {
  return function(...args) {
    handlers.forEach(handler => handler(...args));
  };
}

function noop() {}
