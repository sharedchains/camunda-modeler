/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import {
  mount,
  shallow
} from 'enzyme';

import { DeployDiagramModal } from '..';
import View from '../View';
import AuthTypes from '../AuthTypes';

const MOCK_ENDPOINT_URL = 'http://example.com/deployment/create';
const DEFAULT_ENDPOINT = 'http://localhost:8080/engine-rest';


describe('<DeployDiagramModal>', function() {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';


  beforeEach(() => {
    document.body.appendChild(modalRoot);
  });


  afterEach(() => {
    document.body.removeChild(modalRoot);
  });


  it('should render', function() {
    shallow(<DeployDiagramModal />);
  });


  describe('deployment', function() {

    it('should set state.error when onDeploy throws error', async function() {

      // given
      const endpointUrl = MOCK_ENDPOINT_URL,
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().rejects(new Error('errorMessage'));
      const setSubmittingSpy = sinon.spy();

      const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: setSubmittingSpy
      });

      // expect
      expect(instance.state.error).to.be.a('string').not.eql('');
      expect(instance.state.success).to.eql('');
      expect(setSubmittingSpy).to.be.calledOnceWithExactly(false);
    });


    it('should set state.success when onDeploy succeeds', async function() {

      // given
      const endpointUrl = MOCK_ENDPOINT_URL,
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves(true);
      const setSubmittingSpy = sinon.spy();

      const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: setSubmittingSpy
      });

      // expect
      expect(instance.state.success).to.be.a('string').not.eql('');
      expect(instance.state.error).to.eql('');
      expect(setSubmittingSpy).to.be.calledOnceWithExactly(false);
    });


    it('should unset isLoading when deployment is canceled', async function() {

      // given
      const endpointUrl = MOCK_ENDPOINT_URL,
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves(false);
      const setSubmittingSpy = sinon.spy();

      const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: setSubmittingSpy
      });

      // expect
      expect(instance.state.success).to.eql('');
      expect(instance.state.error).to.eql('');
      expect(setSubmittingSpy).to.be.calledOnceWithExactly(false);
    });


    it('should save endpoint used to deploy', async function() {

      // given
      const endpointUrl = MOCK_ENDPOINT_URL,
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves();
      const onEndpointsUpdateSpy = sinon.spy();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
          onEndpointsUpdate={ onEndpointsUpdateSpy }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onEndpointsUpdateSpy).to.be.calledWith([ endpointUrl ]);
    });


    it('should save exactly the endpoint provided by the user', async function() {

      // given
      const endpointUrl = 'http://example.com',
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves();
      const onEndpointsUpdateSpy = sinon.spy();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
          onEndpointsUpdate={ onEndpointsUpdateSpy }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onEndpointsUpdateSpy).to.be.calledWith([ endpointUrl ]);
    });

  });


  describe('defaults', function() {

    it('should set deployment name based on filename', function() {

      // given
      const wrapper = shallow(<DeployDiagramModal tab={ { name: 'simple.diagram.bpmn' } } />);

      // expect
      expect(wrapper.find(View).prop('initialValues')).to.have.property('deploymentName').eql('simple.diagram');
    });


    it('should set deployment name based on filename for hidden files', function() {

      // given
      const wrapper = shallow(<DeployDiagramModal tab={ { name: '.bpmn' } } />);

      // expect
      expect(wrapper.find(View).prop('initialValues')).to.have.property('deploymentName').eql('.bpmn');
    });


    it(`should set endpointUrl to ${DEFAULT_ENDPOINT} when none is provided`, function() {

      // given
      const wrapper = shallow(<DeployDiagramModal />);

      // expect
      expect(wrapper.find(View).prop('initialValues')).to.have.property('endpointUrl').eql(DEFAULT_ENDPOINT);
    });

  });


  describe('reusing endpoint url', function() {

    it('should set endpointUrl to last one provided in props', function() {

      // given
      const endpointUrl = MOCK_ENDPOINT_URL;

      // when
      const wrapper = shallow(<DeployDiagramModal endpoints={ [ endpointUrl ] } />);

      // expect
      expect(wrapper.find(View).prop('initialValues')).to.have.property('endpointUrl').eql(endpointUrl);
    });
  });


  describe('endpoint URL suffix', function() {

    it('should add "/deployment/create" suffix if user does not provide it', async function() {

      // given
      const endpointUrl = 'http://example.com',
            deploymentName = 'deploymentName',
            expectedEndpointUrl = `${endpointUrl}/deployment/create`;

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.have.property('endpointUrl').eql(expectedEndpointUrl);
    });


    it('should not add excessive "/" before "/deployment/create" suffix', async function() {

      // given
      const endpointUrl = 'http://example.com/',
            deploymentName = 'deploymentName',
            expectedEndpointUrl = `${endpointUrl}deployment/create`;

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.have.property('endpointUrl').eql(expectedEndpointUrl);
    });

  });


  describe('form validation', function() {

    let wrapper,
        instance;

    beforeEach(function() {
      wrapper = shallow(<DeployDiagramModal />);
      instance = wrapper.instance();
    });


    describe('endpointUrl', function() {

      it('should not accept void endpoint url', function() {

        // given
        const endpointUrl = '';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.not.be.undefined;
      });


      it('should not accept endpoint url without protocol', function() {

        // given
        const endpointUrl = 'localhost';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.not.be.undefined;
      });


      it('should not accept ftp protocol for endpoint url', function() {

        // given
        const endpointUrl = 'ftp://localhost';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.not.be.undefined;
      });


      it('should accept endpoint url starting with "https://"', function() {

        // given
        const endpointUrl = 'https://localhost';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.be.undefined;
      });


      it('should accept endpoint url starting with "http://"', function() {

        // given
        const endpointUrl = 'http://localhost';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.be.undefined;
      });

    });


    describe('deployment name', function() {

      it('should not accept void deployment name', function() {

        // given
        const deploymentName = '';

        // then
        expect(instance.validateDeploymentName(deploymentName)).to.not.be.undefined;
      });


      it('should accept not void deployment name', function() {

        // given
        const deploymentName = 'deploymentName';

        // then
        expect(instance.validateDeploymentName(deploymentName)).to.be.undefined;
      });

    });

  });


  describe('authentication', function() {

    it('should not pass auth option when no auth method was chosen', async function() {

      // given
      const endpointUrl = 'http://example.com/',
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.not.have.property('auth');
    });


    it('should pass username and password when authenticating with Basic', async function() {

      // given
      const endpointUrl = 'http://example.com/',
            deploymentName = 'deploymentName',
            username = 'username',
            password = 'password',
            authType = AuthTypes.basic;

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName,
        username,
        password,
        authType
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.have.property('auth');
      expect(payload.auth).to.have.property('username').eql(username);
      expect(payload.auth).to.have.property('password').eql(password);
    });


    it('should pass token when authenticating with Bearer', async function() {

      // given
      const endpointUrl = 'http://example.com/',
            deploymentName = 'deploymentName',
            bearer = 'bearer',
            authType = AuthTypes.bearer;

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName,
        bearer,
        authType
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.have.property('auth');
      expect(payload.auth).to.have.property('bearer').eql(bearer);
    });

  });


  describe('menu updates', function() {

    it('should update menu on mount', function() {

      // given
      const onMenuUpdateSpy = sinon.spy();

      // when
      shallow(
        <DeployDiagramModal
          onMenuUpdate={ onMenuUpdateSpy }
        />
      );

      // then
      expect(onMenuUpdateSpy).to.be.calledOnce;
    });


    it('should enable editing actions on input focus', function() {

      // given
      const wrapper = mount(
        <DeployDiagramModal />
      );
      const modal = wrapper.instance();
      const updateMenuSpy = sinon.spy(modal, 'updateMenu');

      // when
      const input = wrapper.find('input').first();

      input.simulate('focus');

      // then
      expect(updateMenuSpy).to.be.calledOnceWithExactly(true);

      wrapper.unmount();
    });


    it('should disable editing actions on input blur', function() {

      // given
      const wrapper = mount(
        <DeployDiagramModal />
      );
      const modal = wrapper.instance();
      const updateMenuSpy = sinon.spy(modal, 'updateMenu');

      // when
      const input = wrapper.find('input').first();

      input.simulate('blur');

      // then
      expect(updateMenuSpy).to.be.calledOnceWithExactly(false);

      wrapper.unmount();
    });

  });


  describe('<View>', function() {

    let wrapper;

    afterEach(function() {
      wrapper && wrapper.unmount();
    });

    it('should render', function() {
      shallow(<View />);
    });


    it('should render error message', function() {

      // given
      wrapper = mount(<View validators={ { auth: {} } } error={ 'Error message' } />);

      // then
      expect(wrapper.find('.deploy-message.error')).to.have.lengthOf(1);
    });


    it('should render success message', function() {

      // given
      wrapper = mount(<View validators={ { auth: {} } } success={ 'Success message' } />);

      // then
      expect(wrapper.find('.deploy-message.success')).to.have.lengthOf(1);
    });


    it('should not display validation error before first submit', function(done) {

      // given
      wrapper = mount(<View
        initialValues={ { deploymentName: '' } }
        validators={ { deploymentName: () => 'Error', auth: {} } }
      />);

      // when
      const input = wrapper.find('input[name="deploymentName"]');
      input.simulate('change', {
        target: {
          name: 'deploymentName',
          value: ''
        }
      });

      // then
      nextTickExpect(done, () => expect(wrapper.find('.invalid')).to.have.lengthOf(0));
    });


    it('should display validation error after first submit', function(done) {

      // given
      wrapper = mount(<View
        initialValues={ { deploymentName: '' } }
        validators={ { deploymentName: () => 'Error', auth: {} } }
      />);

      const input = wrapper.find('input[name="deploymentName"]');
      input.simulate('change', {
        target: {
          name: 'deploymentName',
          value: ''
        }
      });

      // when
      wrapper.find('form').simulate('submit');

      // then
      nextTickExpect(done, () =>{
        expect(wrapper.find('.valid')).to.have.lengthOf(1);
      });
    });

  });

});



// helper
function nextTickExpect(done, fn) {
  process.nextTick(() => {
    try {
      fn();
    } catch (error) {
      return done(error);
    }

    done();
  });
}
