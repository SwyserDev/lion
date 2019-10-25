import { LitElement, css, html } from '@lion/core';

/* eslint-disable-next-line class-methods-use-this */
function uuid() {
  return Math.random()
    .toString(36)
    .substr(2, 10);
}

export class LionTabs extends LitElement {
  static get properties() {
    return {
      /**
       * index number of the selected tab
       */
      selectedIndex: {
        type: Number,
        value: 0,
      },
    };
  }

  static get styles() {
    return [
      css`
        .tabs__tab-group {
          display: flex;
          border-bottom: 1px solid grey;
        }

        ::slotted([slot='tab']) {
          padding: 8px;
        }

        ::slotted([slot='tab'][selected]) {
          font-weight: bold;
        }

        ::slotted([slot='panel']) {
          visibility: hidden;
          display: none;
        }

        ::slotted([slot='panel'][selected]) {
          visibility: visible;
          display: block;
        }

        .tabs__panels {
          display: block;
        }
      `,
    ];
  }

  render() {
    return html`
      <div class="tabs__tab-group">
        <slot name="tab" role="tablist"></slot>
      </div>
      <div class="tabs__panels">
        <slot name="panel" role="tabpanel"></slot>
      </div>
    `;
  }

  constructor() {
    super();
    this.__setupStore();
    this.selectedIndex = 0;
  }

  __setupStore() {
    this.__store = [];
    const buttons = this.querySelectorAll('[slot="tab"]');
    const panels = this.querySelectorAll('[slot="panel"]');
    // TODO: check if buttons.length === panels.length ?!
    // Throw error otherwise
    buttons.forEach((button, index) => {
      const uid = uuid();
      const panel = panels[index];
      this.__setupPanel(panel, uid);
      this.__setupButton(button, index, uid);
      this.__store.push({ button, panel });
    });
  }

  __setupPanel(element, uid) {
    element.setAttribute('id', `panel-${uid}`);
    element.setAttribute('role', 'tabpanel');
    element.setAttribute('aria-labelledby', `button-${uid}`);
    this.__deselectPanel(element);
  }

  // eslint-disable-next-line class-methods-use-this
  __selectPanel(element) {
    element.setAttribute('selected', true);
  }

  // eslint-disable-next-line class-methods-use-this
  __deselectPanel(element) {
    element.removeAttribute('selected');
  }

  __setupButton(element, index, uid) {
    element.setAttribute('id', `button-${uid}`);
    element.setAttribute('role', 'tab');
    element.setAttribute('aria-controls', `panel-${uid}`);
    element.addEventListener('click', this.__createButtonClickHandler(index));
    element.addEventListener('keyup', this.__handleButtonKeyup.bind(this));
    this.__deselectButton(element);
  }

  __createButtonClickHandler(index) {
    return () => {
      this.selectedIndex = index;
    };
  }

  __handleButtonKeyup(e) {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        if (this.selectedIndex + 1 >= this._pairCount) {
          this.selectedIndex = 0;
        } else {
          this.selectedIndex += 1;
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        if (this.selectedIndex <= 0) {
          this.selectedIndex = this._pairCount - 1;
        } else {
          this.selectedIndex -= 1;
        }
        break;
      case 'Home':
        this.selectedIndex = 0;
        break;
      case 'End':
        this.selectedIndex = this._pairCount - 1;
        break;
      default:
      // nothing
    }
  }

  // eslint-disable-next-line class-methods-use-this
  __selectButton(element) {
    element.setAttribute('selected', true);
    element.setAttribute('aria-selected', true);
    element.setAttribute('tabindex', 0);
  }

  // eslint-disable-next-line class-methods-use-this
  __deselectButton(element) {
    element.removeAttribute('selected');
    element.setAttribute('aria-selected', false);
    element.setAttribute('tabindex', -1);
  }

  set selectedIndex(value) {
    const stale = this.__selectedIndex;
    this.__selectedIndex = value;
    this.__updateSelected();
    // TODO: discuss before or after request update?!
    this.dispatchEvent(new Event('selected-changed'));
    this.requestUpdate('selectedIndex', stale);
  }

  get selectedIndex() {
    return this.__selectedIndex;
  }

  get _pairCount() {
    return this.__store.length;
  }

  __updateSelected() {
    const previousButton = this.querySelector('[slot="tab"][selected]');
    const previousPanel = this.querySelector('[slot="panel"][selected]');
    if (previousButton) {
      this.__deselectButton(previousButton);
    }
    if (previousPanel) {
      this.__deselectPanel(previousPanel);
    }
    const { button: currentButton, panel: currentPanel } = this.__store[this.selectedIndex];
    if (currentButton) {
      this.__selectButton(currentButton);
    }
    if (currentPanel) {
      this.__selectPanel(currentPanel);
    }
  }
}
