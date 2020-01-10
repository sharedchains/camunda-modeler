/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import {
  assign
} from 'min-dash';

import {
  Loader
} from '../../primitives';

import {
  debounce
} from '../../../util';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import PropertiesContainer from '../PropertiesContainer';

import CamundaDmnModeler from './modeler';

import { active as isInputActive } from '../../../util/dom/isInput';

import {
  getDmnDrdEditMenu,
  getDmnDecisionTableEditMenu,
  getDmnLiteralExpressionEditMenu
} from './getDmnEditMenu';

import getDmnWindowMenu from './getDmnWindowMenu';

import css from './DmnEditor.less';

import generateImage from '../../util/generateImage';

import Metadata from '../../../util/Metadata';


const EXPORT_AS = [ 'png', 'jpeg', 'svg' ];


export class DmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = { };

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();

    this.handleResize = debounce(this.handleResize);
  }

  componentDidMount() {
    this._isMounted = true;

    const modeler = this.getModeler();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const activeViewer = modeler.getActiveViewer();

    if (activeViewer) {
      activeViewer.get('propertiesPanel').attachTo(this.propertiesPanelRef.current);
    }

    this.checkImport();
  }

  componentWillUnmount() {
    this._isMounted = false;

    const modeler = this.getModeler();

    this.listen('off');

    modeler.detach();
  }

  componentDidUpdate(prevProps) {
    this.checkImport(prevProps);

    if (isCachedStateChange(prevProps, this.props)) {
      this.handleChanged();
    }
  }

  ifMounted = (fn) => {
    return (...args) => {
      if (this._isMounted) {
        fn(...args);
      }
    };
  }

  listen(fn) {
    const modeler = this.getModeler();

    [
      'saveXML.done',
      'attach',
      'view.selectionChanged',
      'view.directEditingChanged',
      'propertiesPanel.focusin',
      'propertiesPanel.focusout'
    ].forEach((event) => {
      modeler[fn](event, this.handleChanged);
    });

    modeler[fn]('views.changed', this.viewsChanged);

    modeler[fn]('view.contentChanged', this.viewContentChanged);

    modeler[fn]('error', this.handleError);
  }

  isDirty = () => {
    let {
      dirty,
      modeler,
      stackIdx
    } = this.getCached();

    return dirty || modeler.getStackIdx() !== stackIdx;
  }

  viewContentChanged = () => {
    this.handleChanged();
  }

  handleImport = (error, warnings) => {
    const {
      activeSheet,
      onImport,
      xml
    } = this.props;

    const modeler = this.getModeler();

    const stackIdx = modeler.getStackIdx();

    onImport(error, warnings);

    if (!error) {
      this.setCached({
        dirty: false,
        lastXML: xml,
        stackIdx
      });

      this.setState({
        importing: false
      });

      if (activeSheet && activeSheet.element) {
        return this.open(activeSheet.element);
      }

      const initialView = modeler._getInitialView(modeler._views);

      this.open(initialView.element);
    }

  }

  viewsChanged = ({ activeView, views }) => {
    const {
      onSheetsChanged
    } = this.props;

    const {
      dirty,
      stackIdx
    } = this.getCached();

    const previousView = this.getCached().activeView;

    const modeler = this.getModeler();

    let activeSheet;

    const sheets = views.map(view => {
      const { element, type } = view;

      const newSheet = {
        element,
        id: element.id,
        name: getSheetName(view),
        order: type === 'drd' ? -2 : -1
      };

      if (view === activeView) {
        activeSheet = newSheet;
      }

      return newSheet;
    });

    onSheetsChanged(sheets, activeSheet);

    const activeViewer = modeler.getActiveViewer();

    // only attach properties panel if view is switched
    if (activeViewer &&
      (!previousView || previousView.element !== activeView.element)) {
      activeViewer.get('propertiesPanel').attachTo(this.propertiesPanelRef.current);
    }

    // must be called last
    this.setCached({
      activeView,
      dirty: dirty || modeler.getStackIdx() !== stackIdx,
      views
    });

    this.handleChanged();
  }

  undo = () => {
    const modeler = this.getModeler();

    modeler.getActiveViewer().get('commandStack').undo();
  }

  redo = () => {
    const modeler = this.getModeler();

    modeler.getActiveViewer().get('commandStack').redo();
  }

  handleChanged = () => {
    const modeler = this.getModeler();

    const {
      onChanged
    } = this.props;

    const activeViewer = modeler.getActiveViewer(),
          activeView = modeler.getActiveView();

    if (!activeViewer) {
      return;
    }

    const dirty = this.isDirty();

    const commandStack = activeViewer.get('commandStack');

    const inputActive = isInputActive();

    const newState = {
      close: true,
      copy: false,
      cut: false,
      dirty,
      exportAs: 'saveSVG' in activeViewer ? EXPORT_AS : false,
      inputActive,
      paste: false,
      propertiesPanel: true,
      redo: commandStack.canRedo(),
      save: true,
      undo: commandStack.canUndo()
    };

    const selection = activeViewer.get('selection', false);

    const hasSelection = selection && !!selection.get();

    const selectionLength = hasSelection ? selection.get().length : 0;

    let editMenu;

    if (activeView.type === 'drd') {
      assign(newState, {
        defaultCopyCutPaste: inputActive,
        defaultUndoRedo: inputActive,
        editLabel: !inputActive && !!selectionLength,
        lassoTool: !inputActive,
        moveCanvas: !inputActive,
        moveSelection: !inputActive && !!selectionLength,
        removeSelected: inputActive || !!selectionLength,
        selectAll: true,
        zoom: true
      });

      editMenu = getDmnDrdEditMenu(newState);
    } else if (activeView.type === 'decisionTable') {
      assign(newState, {
        defaultCopyCutPaste: true,
        defaultUndoRedo: true,
        hasSelection: activeViewer.get('selection').hasSelection(),
        removeSelected: inputActive,
        selectAll: inputActive
      });

      // ensure backwards compatibility
      // https://github.com/camunda/camunda-modeler/commit/78357e3ed9e6e0255ac8225fbdf451a90457e8bf#diff-bd5be70c4e5eadf1a316c16085a72f0fL17
      newState.dmnRuleEditing = !!selectionLength;
      newState.dmnClauseEditing = !!selectionLength;

      editMenu = getDmnDecisionTableEditMenu(newState);
    } else if (activeView.type === 'literalExpression') {
      assign(newState, {
        defaultCopyCutPaste: true,
        defaultUndoRedo: true,
        removeSelected: true,
        selectAll: true
      });

      editMenu = getDmnLiteralExpressionEditMenu(newState);
    }

    // ensure backwards compatibility
    // https://github.com/camunda/camunda-modeler/commit/78357e3ed9e6e0255ac8225fbdf451a90457e8bf#diff-bd5be70c4e5eadf1a316c16085a72f0fL17
    newState.activeEditor = activeView.type;
    newState.dmn = true;
    newState.editable = true;
    newState.elementsSelected = !!selectionLength;
    newState.inactiveInput = !inputActive;

    const windowMenu = getDmnWindowMenu(newState);

    if (typeof onChanged === 'function') {
      onChanged({
        ...newState,
        editMenu,
        windowMenu
      });
    }

    this.setState(newState);
  }

  handleError = (event) => {
    const {
      error
    } = event;

    const {
      onError
    } = this.props;

    onError(error);
  }

  checkImport(prevProps) {
    if (!this.isImportNeeded(prevProps)) {
      return this.checkSheetChange(prevProps);
    }

    this.importXML();
  }

  isImportNeeded(prevProps) {
    const {
      importing
    } = this.state;

    if (importing) {
      return false;
    }

    const {
      xml
    } = this.props;

    if (prevProps && prevProps.xml === xml) {
      return false;
    }

    const {
      lastXML
    } = this.getCached();

    return xml !== lastXML;
  }

  importXML() {
    const {
      modeler
    } = this.getCached();

    this.setState({
      importing: true
    });

    modeler.importXML(this.props.xml, this.ifMounted(this.handleImport));
  }

  checkSheetChange(prevProps) {
    if (!this.shouldOpenActiveSheet(prevProps)) {
      return;
    }

    this.open(this.props.activeSheet.element);
  }

  shouldOpenActiveSheet(prevProps) {
    return !prevProps || prevProps.activeSheet.id !== this.props.activeSheet.id;
  }

  open = (element) => {
    const {
      activeView,
      dirty,
      modeler,
      stackIdx
    } = this.getCached();

    let view = modeler.getView(element);

    if (!view) {

      // try to find view based on ID
      // after re-import reference comparison won't work anymore
      view = modeler.getViews().find(view => view.element.id === element.id);
    }

    if (!view) {
      return;
    }

    if (!activeView || activeView.element !== element) {
      this.setCached({
        dirty: dirty || this.getModeler().getStackIdx() !== stackIdx
      });

      modeler.open(view);

      this.setCached({
        stackIdx: this.getModeler().getStackIdx()
      });
    }
  }

  triggerAction = (action, context) => {
    const {
      layout: {
        propertiesPanel: propertiesPanelLayout
      },
      onLayoutChanged: handleLayoutChange
    } = this.props;

    const modeler = this.getModeler();

    if (action === 'resize') {
      return this.handleResize();
    }

    if (action === 'toggleProperties') {
      const newLayout = {
        propertiesPanel: {
          ...propertiesPanelLayout,
          open: !propertiesPanelLayout.open
        }
      };

      return handleLayoutChange(newLayout);
    }

    if (action === 'resetProperties') {
      const newLayout = {
        propertiesPanel: {
          width: 250,
          open: true
        }
      };

      return handleLayoutChange(newLayout);
    }

    if (action === 'zoomIn') {
      action = 'stepZoom';

      context = {
        value: 1
      };
    }

    if (action === 'zoomOut') {
      action = 'stepZoom';

      context = {
        value: -1
      };
    }

    if (action === 'resetZoom') {
      action = 'zoom';

      context = {
        value: 1
      };
    }

    if (action === 'zoomFit') {
      action = 'zoom';

      context = {
        value: 'fit-viewport'
      };
    }

    modeler.getActiveViewer()
      .get('editorActions')
      .trigger(action, context);
  }

  /**
   * @returns {CamundaDmnModeler}
   */
  getModeler() {
    const {
      modeler
    } = this.getCached();

    return modeler;
  }

  handleResize = () => {
    const {
      modeler
    } = this.getCached();

    const view = modeler.getActiveView();

    const viewType = view && view.type;

    if (viewType !== 'drd') {
      return;
    }

    const viewer = modeler.getActiveViewer();

    const canvas = viewer.get('canvas');
    const eventBus = viewer.get('eventBus');

    canvas.resized();
    eventBus.fire('propertiesPanel.resized');
  }

  getXML() {
    const {
      lastXML,
      modeler
    } = this.getCached();

    const stackIdx = modeler.getStackIdx();

    return new Promise((resolve, reject) => {
      if (!this.isDirty()) {
        return resolve(lastXML || this.props.xml);
      }

      modeler.saveXML({ format: true }, (err, xml) => {
        this.setCached({
          dirty: false,
          lastXML: xml,
          stackIdx
        });

        if (err) {
          this.handleError({
            error: err
          });

          return reject(err);
        }

        return resolve(xml);
      });
    });
  }

  async exportAs(type) {
    const svg = await this.exportSVG();

    if (type === 'svg') {
      return svg;
    }

    return generateImage(type, svg);
  }

  exportSVG() {
    const modeler = this.getModeler();

    const viewer = modeler.getActiveViewer();

    return new Promise((resolve, reject) => {
      viewer.saveSVG((err, svg) => {
        if (err) {
          return reject(err);
        }

        return resolve(svg);
      });
    });
  }

  render() {
    const {
      layout,
      onLayoutChanged
    } = this.props;

    const {
      importing,
    } = this.state;

    const modeler = this.getModeler();

    const activeView = modeler.getActiveView();

    const hideIfCollapsed = activeView && activeView.type !== 'drd';

    return (
      <div className={ css.DmnEditor }>

        <Loader hidden={ !importing } />

        <div className="diagram" ref={ this.ref }></div>

        <PropertiesContainer
          className="properties"
          layout={ layout }
          ref={ this.propertiesPanelRef }
          hideIfCollapsed={ hideIfCollapsed }
          onLayoutChanged={ onLayoutChanged } />

      </div>
    );
  }

  static createCachedState() {
    const {
      name,
      version
    } = Metadata;

    const modeler = new CamundaDmnModeler({
      exporter: {
        name,
        version
      }
    });

    const stackIdx = modeler.getStackIdx();

    return {
      __destroy: () => {
        modeler.destroy();
      },
      dirty: false,
      lastXML: null,
      modeler,
      stackIdx
    };
  }

}

export default WithCache(WithCachedState(DmnEditor));

// helpers //////////

const viewNames = {
  decisionTable: 'Decision Table',
  literalExpression: 'Literal Expression'
};

function getSheetName(view) {
  if (view.type === 'drd') {
    return 'Diagram';
  }

  return view.element.name || viewNames[view.type];
}

function isCachedStateChange(prevProps, props) {
  return prevProps.cachedState !== props.cachedState;
}