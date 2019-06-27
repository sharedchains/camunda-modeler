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

import { MultiSheetTab } from '../MultiSheetTab';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../cached';

import {
  Editor as DefaultEditor,
  providers as defaultProviders,
  tab as defaultTab
} from './mocks';

const { spy } = sinon;


describe('<MultiSheetTab>', function() {

  it('should render', function() {
    const {
      instance
    } = renderTab();

    expect(instance).to.exist;
  });


  describe('xml prop', function() {

    it('update lastXML if xml prop changed (update)', function() {

      // given
      const {
        instance,
        wrapper
      } = renderTab({
        xml: 'foo'
      });

      const xml = 'bar';

      // when
      wrapper.setProps({
        xml
      });

      // then
      const { lastXML } = instance.getCached();

      expect(lastXML).to.equal(xml);
    });

  });


  describe('#handleImport', function() {

    const error = new Error('error');
    const warnings = [ 'warning', 'warning' ];

    it('should import without errors', function() {

      // given
      const errorSpy = spy(),
            warningSpy = spy();

      const {
        instance
      } = renderTab({
        onError: errorSpy,
        onWarning: warningSpy
      });

      // when
      instance.handleImport();

      // then
      expect(errorSpy).not.to.have.been.called;
      expect(warningSpy).not.to.have.been.called;
    });


    it('should import with warnings', function() {

      // given
      const errorSpy = spy(),
            warningSpy = spy();

      const {
        instance
      } = renderTab({
        onError: errorSpy,
        onWarning: warningSpy
      });

      // when
      instance.handleImport(null, warnings);

      // then
      expect(errorSpy).not.to.have.been.called;
      expect(warningSpy).to.have.been.calledTwice;
      expect(warningSpy.alwaysCalledWith('warning')).to.be.true;
    });


    it('should open warnings toast', function() {

      // given
      const {
        instance
      } = renderTab();

      // when
      instance.handleImport(null, warnings);

      const {
        warnings: stateWarnings,
        currentToast
      } = instance.getCached();

      // then
      expect(stateWarnings).to.eql(warnings);
      expect(currentToast).to.eql('WARNINGS');

    });


    it('should import with error', function() {

      // given
      const errorSpy = spy(),
            warningSpy = spy();

      const {
        instance
      } = renderTab({
        onError: errorSpy,
        onWarning: warningSpy
      });

      const showImportErrorDialogSpy = spy(instance, 'showImportErrorDialog');

      // when
      instance.handleImport(error);

      // then
      expect(errorSpy).to.have.been.calledWith(error);
      expect(warningSpy).not.to.have.been.called;
      expect(showImportErrorDialogSpy).to.have.been.called;
    });

  });


  describe('#showImportErrorDialog', function() {

    it('should open', function() {

      // given
      const actionSpy = spy();

      const {
        instance
      } = renderTab({
        onAction: actionSpy
      });

      // when
      instance.showImportErrorDialog(new Error('error'));

      // then
      expect(actionSpy).to.have.been.called;
    });


    it('should open forum', async function() {

      // given
      const actionSpy = spy(action => {
        if (action === 'show-dialog') {
          return 'ask-in-forum';
        }
      });

      const {
        instance
      } = renderTab({
        onAction: actionSpy
      });

      // when
      await instance.showImportErrorDialog(new Error('error'));

      // then
      expect(actionSpy).to.have.been.calledTwice;
    });


    it('should open fallback on error', function() {

      // given
      const {
        instance
      } = renderTab();

      // when
      instance.handleImport(new Error('error'));

      // then
      const {
        activeSheet
      } = instance.getCached();

      expect(activeSheet.id).to.equal('fallback');
    });

  });


  it('#openFallback', function() {

    // given
    const {
      instance
    } = renderTab();

    // when
    instance.openFallback();

    // then
    const {
      activeSheet
    } = instance.getCached();

    expect(activeSheet.id).to.equal('fallback');
  });


  describe('#sheetsChanged', function() {

    it('should order sheets', function() {

      // given
      const {
        instance
      } = renderTab();

      const sheets = [
        { id: '2', order: -1 },
        { id: '3', order: 0 },
        { id: '1', order: -2 },
        { id: '4', order: 1 },
      ];

      // when
      instance.sheetsChanged(sheets);

      // then
      expectSheetOrder(instance.getCached().sheets, [
        '1',
        '2',
        '3',
        '4'
      ]);
    });

  });


  describe('#isUnsaved', function() {

    it('should be unsaved', function() {

      // given
      const {
        instance
      } = renderTab();

      // when
      const isUnSaved = instance.isUnsaved(defaultTab);

      // then
      expect(isUnSaved).to.be.true;
    });

  });


  describe('dirty state', function() {

    let instance,
        wrapper;

    const INITIAL_XML = '<foo></foo>';

    beforeEach(function() {
      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: INITIAL_XML
        }
      });

      ({ instance, wrapper } = renderTab({
        xml: INITIAL_XML,
        cache,
        providers: [{
          type: 'foo',
          editor: DefaultEditor,
          defaultName: 'Foo'
        }, {
          type: 'bar',
          editor: DefaultEditor,
          defaultName: 'Bar'
        }]
      }));
    });


    it('should NOT be dirty initially', function() {

      // when
      const dirty = instance.isDirty();

      // then
      expect(dirty).to.be.false;
    });


    it('should NOT be dirty on switch sheet', async function() {

      // given
      const { sheets } = instance.getCached();

      // make sure editor returns same XML
      wrapper.find(DefaultEditor).first().instance().setXML(INITIAL_XML);

      // when
      await instance.switchSheet(sheets[1]);

      // then
      expect(instance.isDirty()).to.be.false;
    });


    it('should be dirty on switch sheet', async function() {

      // given
      const { sheets } = instance.getCached();

      // make sure editor returns NOT same XML
      wrapper.find(DefaultEditor).first().instance().setXML(`${INITIAL_XML}-bar`);

      // when
      await instance.switchSheet(sheets[1]);

      // then
      expect(instance.isDirty()).to.be.true;
    });


    it('should be dirty after new content is given', async function() {

      // when
      await instance.handleContentUpdated(`${INITIAL_XML}-bar`);

      // then
      expect(instance.isDirty()).to.be.true;
    });


    it('should not be dirty after same content is given', async function() {

      // when
      await instance.handleContentUpdated(INITIAL_XML);

      // then
      expect(instance.isDirty()).to.be.false;
    });

  });


  describe('toast handling', function() {

    let instance;

    beforeEach(function() {
      const rendered = renderTab();

      instance = rendered.instance;
    });


    it('should set toast', function() {
      // given
      const fakeToastName = 'toast';

      // when
      instance.setToast(fakeToastName);

      const {
        currentToast
      } = instance.getCached();

      // then
      expect(currentToast).to.eql(fakeToastName);
    });


    it('should close toast', function() {
      // given
      const fakeToastName = 'toast';

      instance.setToast(fakeToastName);

      // when
      instance.closeToast();

      const {
        currentToast
      } = instance.getCached();

      // then
      expect(currentToast).to.eql(null);
    });


  });

});


// helpers //////////////////////////////

function noop() {}

const TestTab = WithCachedState(MultiSheetTab);

function renderTab(options = {}) {
  const {
    id,
    cache,
    xml,
    tab,
    layout,
    onChanged,
    onError,
    onWarning,
    onShown,
    onLayoutChanged,
    onContextMenu,
    onAction,
    providers
  } = options;

  const wrapper = mount(
    <TestTab
      id={ id || 'editor' }
      tab={ tab || defaultTab }
      xml={ xml }
      onChanged={ onChanged || noop }
      onError={ onError || noop }
      onWarning={ onWarning || noop }
      onShown={ onShown || noop }
      onLayoutChanged={ onLayoutChanged || noop }
      onContextMenu={ onContextMenu || noop }
      onAction={ onAction || noop }
      providers={ providers || defaultProviders }
      cache={ cache || new Cache() }
      layout={ layout || {
        minimap: {
          open: false
        },
        propertiesPanel: {
          open: true
        }
      } }
    />
  );

  const multiSheetTab = wrapper.find(MultiSheetTab);

  const instance = multiSheetTab.instance();

  return {
    instance,
    wrapper
  };
}

function expectSheetOrder(sheets, expectedOrder) {
  sheets.forEach((sheet, index) => {
    expect(sheet.id === expectedOrder[ index ]);
  });
}