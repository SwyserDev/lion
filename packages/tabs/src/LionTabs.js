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

        ::slotted([slot="tab"]) {
          padding: 8px;
        }

        ::slotted([slot="tab"][selected]) {
          font-weight: bold;
        }

        ::slotted([slot="panel"]) {
          visibility: hidden;
        }

        ::slotted([slot="panel"][selected]) {
          visibility: visible;
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
        <slot
          name="tab"
          role="tablist"
        ></slot>
      </div>
      <div class="tabs__panels">
        <slot
          name="panel"
          role="tabpanel"
        ></slot>
      </div>
    `
  }

  constructor() {
    super();

    this.__setupStore();
    // TODO: discuss if we should use setter or assin to private property?
    this.selectedIndex = 0;
  }

  __setupStore() {
    this.__store = {
      collection: [],
      previous: null,
    }
    const buttons = this.querySelectorAll('[slot="tab"]');
    const panels = this.querySelectorAll('[slot="panel"]');
    // TODO: check if buttons.length === panels.length ?!
    // Throw error otherwise
    buttons.forEach((button, index) => {
      const uid = uuid();
      const panel = panels[index];
      this.__setupPanel(panel, uid);
      this.__setupButton(button, index, uid);
      this.__store.collection.push({
        button,
        panel,
      })
    });
  }

  __setupPanel(element, uid) {
    element.setAttribute('id', `panel-${uid}`);
    element.setAttribute('role', 'tabpanel');
    element.setAttribute('aria-labelledby', `button-${uid}`);
  }

  __setupButton(element, index, uid) {
    element.setAttribute('id', `button-${uid}`)
    element.setAttribute('role', 'tab');
    element.setAttribute('tabindex', -1);
    element.setAttribute('aria-controls', `panel-${uid}`)
    element.setAttribute('aria-selected', false);
    element.addEventListener('click', e => {
    this.selectedIndex = index;
    });
    element.addEventListener('keyup', e => {
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
      }
    });
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
    return this.__store.collection.length;
  }

  __updateSelected() {
    const { button, panel } = this.__store.collection[this.selectedIndex];
    const previous = this.__store.previous;
    if (previous) {
      previous.button.removeAttribute('selected');
      previous.button.removeAttribute('aria-selected', true);
      previous.button.setAttribute('tabindex', -1);
      previous.panel.removeAttribute('selected');
    }
    button.setAttribute('selected', true);
    button.setAttribute('aria-selected', true);
    button.setAttribute('tabindex', 0);
    panel.setAttribute('selected', true);
    this.__store.previous = {
      button,
      panel,
    }
  }
}
