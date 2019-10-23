import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';

import '../lion-tabs.js';

const basicTabs = html`
  <lion-tabs>
    <button slot="tab">tab 1</button>
    <div slot="panel">panel 1</div>
    <button slot="tab">tab 2</button>
    <div slot="panel">panel 2</div>
    <button slot="tab">tab 3</button>
    <div slot="panel">panel 3</div>
  </lion-tabs>
`;

describe.only('<lion-tabs>', () => {
  describe('Tabs', () => {
    it('sets selectedIndex to 0 by default', async () => {
      const el = await fixture(basicTabs);
      expect(el.selectedIndex).to.equal(0);
    });

    it('can programmatically set selectedIndex', async () => {
      const el = await fixture(html`
        <lion-tabs .selectedIndex=${1}>
          <div slot="tab">tab 1</div>
          <div slot="panel">panel 1</div>
          <div slot="tab">tab 2</div>
          <div slot="panel">panel 2</div>
        </lion-tabs>
      `);
      expect(el.selectedIndex).to.equal(1);
      expect(el.querySelector('[slot=tab][selected]').textContent).to.equal('tab 2');

      el.selectedIndex = 0;
      expect(el.querySelector('[slot=tab][selected]').textContent).to.equal('tab 1');
    });

    it('has [selected] on current selected tab which serves as styling hook', async () => {
      const el = await fixture(basicTabs);
      const tabs = el.querySelectorAll('[slot=tab]');
      el.selectedIndex = 0;
      expect(tabs[0]).to.have.attribute('selected');
      expect(tabs[1]).to.not.have.attribute('selected');

      el.selectedIndex = 1;
      expect(tabs[0]).to.not.have.attribute('selected');
      expect(tabs[1]).to.have.attribute('selected');
    });

    it('sends event "selected-changed" for every selected state change', async () => {
      const el = await fixture(basicTabs);
      const spy = sinon.spy();
      el.addEventListener('selected-changed', spy);
      el.selectedIndex = 1;
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('Tabs ([slot=tab])', () => {
    it('adds role=tab', async () => {
      const el = await fixture(html`
        <lion-tabs>
          <button slot="tab">tab</button>
          <div slot="panel">panel</div>
        </lion-tabs>
      `);
      expect(el.querySelector('[slot=tab]')).to.have.attribute('role', 'tab');
    });

    /**
     * Not in scope:
     * - has flexible html that allows animations like the material design underline
     */
  });

  describe('Tab Panels (slot=panel)', () => {
    it('are visible when corresponding tab is selected ', async () => {
      const el = await fixture(basicTabs);
      const panels = el.querySelectorAll('[slot=panel]');
      el.selectedIndex = 0;
      expect(panels[0]).to.be.visible;
      expect(panels[1]).to.be.not.visible;

      el.selectedIndex = 1;
      expect(panels[0]).to.be.not.visible;
      expect(panels[1]).to.be.visible;
    });

    it.skip('have a DOM structure that allows them to be animated ', async () => {});
  });

  /**
   * We will immediately switch content as all our content comes from light dom.
   *
   * See Note at https://www.w3.org/TR/wai-aria-practices/#keyboard-interaction-19
   * > It is recommended that tabs activate automatically when they receive focus as long as their
   * > associated tab panels are displayed without noticeable latency. This typically requires tab
   * > panel content to be preloaded.
   */
  describe('User interaction', () => {
    it('selects a tab on click', async () => {
      const el = await fixture(basicTabs);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs[1].dispatchEvent(new Event('click'));
      expect(el.selectedIndex).to.equal(1);
    });

    it('selects next tab on [arrow-right] and [arrow-down]', async () => {
      const el = await fixture(basicTabs);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
      expect(el.selectedIndex).to.equal(1);
      tabs[1].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      expect(el.selectedIndex).to.equal(2);
    });

    it('selects previous tab on [arrow-left] and [arrow-up]', async () => {
      const el = await fixture(html`
        <lion-tabs .selectedIndex=${1}>
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
          <button slot="tab">tab 3</button>
          <div slot="panel">panel 3</div>
        </lion-tabs>
      `);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs.selectedIndex = 2;
      tabs[2].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
      expect(el.selectedIndex).to.equal(1);
      tabs[1].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
      expect(el.selectedIndex).to.equal(0);
    });

    it('selects first tab on [home]', async () => {
      const el = await fixture(html`
        <lion-tabs .selectedIndex=${1}>
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
        </lion-tabs>
      `);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs[1].dispatchEvent(new KeyboardEvent('keyup', { key: 'Home' }));
      expect(el.selectedIndex).to.equal(0);
    });

    it('selects last tab on [end]', async () => {
      const el = await fixture(basicTabs);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'End' }));
      expect(el.selectedIndex).to.equal(2);
    });

    it('selects first tab on [arrow-right] if on last tab', async () => {
      const el = await fixture(html`
        <lion-tabs selectedIndex="2">
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
          <button slot="tab">tab 3</button>
          <div slot="panel">panel 3</div>
        </lion-tabs>
      `);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
      expect(el.selectedIndex).to.equal(0);
    });

    it('selects last tab on [arrow-left] if on first tab', async () => {
      const el = await fixture(html`
        <lion-tabs>
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
          <button slot="tab">tab 3</button>
          <div slot="panel">panel 3</div>
        </lion-tabs>
      `);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
      expect(el.selectedIndex).to.equal(2);
    });
  });

  describe('Accessibility', () => {
    it('does not make panels focusable', async () => {
      const el = await fixture(html`
        <lion-tabs>
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
        </lion-tabs>
      `);
      expect(el.querySelector('[slot=panel]')).to.not.have.attribute('tabindex');
      expect(el.querySelector('[slot=panel]')).to.not.have.attribute('tabindex');
    });

    it('makes selected tab focusable (other tabs are unfocusable)', async () => {
      const el = await fixture(html`
        <lion-tabs>
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
          <button slot="tab">tab 3</button>
          <div slot="panel">panel 3</div>
        </lion-tabs>
      `);
      const tabs = el.querySelectorAll('[slot=tab]');
      expect(tabs[0]).to.have.attribute('tabindex', '0');
      expect(tabs[1]).to.have.attribute('tabindex', '-1');
      expect(tabs[2]).to.have.attribute('tabindex', '-1');
    });

    describe('Tabs', () => {
      it('links ids of content items to tab via [aria-controls]', async () => {
        const el = await fixture(html`
          <lion-tabs>
            <button id="t1" slot="tab">tab 1</button>
            <div id="p1" slot="panel">panel 1</div>
            <button id="t2" slot="tab">tab 2</button>
            <div id="p2" slot="panel">panel 2</div>
          </lion-tabs>
        `);
        const tabs = el.querySelectorAll('[slot=tab]');
        const panels = el.querySelectorAll('[slot=panel]');
        expect(tabs[0].getAttribute('aria-controls')).to.equal(panels[0].id);
        expect(tabs[1].getAttribute('aria-controls')).to.equal(panels[1].id);
      });

      it('adds aria-selected=“true” to selected tab', async () => {
        const el = await fixture(html`
          <lion-tabs>
            <button id="t1" slot="tab">tab 1</button>
            <div id="p1" slot="panel">panel 1</div>
            <button id="t2" slot="tab">tab 2</button>
            <div id="p2" slot="panel">panel 2</div>
            <button id="t3" slot="tab">tab 3</button>
            <div id="p3" slot="panel">panel 3</div>
          </lion-tabs>
        `);

        const tabs = el.querySelectorAll('[slot=tab]');
        expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
        expect(tabs[1].getAttribute('aria-selected')).to.equal('false');
        expect(tabs[2].getAttribute('aria-selected')).to.equal('false');
      });
    });

    describe('panels', () => {
      it('adds role="tabpanel" to panels', async () => {
        const el = await fixture(html`
          <lion-tabs>
            <button slot="tab">tab 1</button>
            <div slot="panel">panel 1</div>
            <button slot="tab">tab 2</button>
            <div slot="panel">panel 2</div>
          </lion-tabs>
        `);
        const panels = el.querySelectorAll('[slot=panel]');
        expect(panels[0]).to.have.attribute('role', 'tabpanel');
        expect(panels[1]).to.have.attribute('role', 'tabpanel');
      });

      it('adds aria-labelledby referring to tab ids', async () => {
        const el = await fixture(html`
          <lion-tabs>
            <button slot="tab">tab 1</button>
            <div slot="panel">panel 1</div>
            <button slot="tab">tab 2</button>
            <div slot="panel">panel 2</div>
          </lion-tabs>
        `);
        const panels = el.querySelectorAll('[slot=panel]');
        const tabs = el.querySelectorAll('[slot=tab]');
        expect(panels[0]).to.have.attribute('aria-labelledby', tabs[0].id);
        expect(panels[1]).to.have.attribute('aria-labelledby', tabs[1].id);
      });
    });
  });

  /**
   * Nice to have - e.g. it is not blocking the release of the component
   *
   * => POC needed as it requires a ResizeObserver
   * => need to check if polyfill for IE11 is good enough https://github.com/juggle/resize-observer
   */
  describe.skip('Vertical orientation', () => {
    it('has a private [_vertical] attribute which is used as a style hook for a vertical layout', async () => {
      const el = await fixture(html`
        <lion-tabs _vertical>
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
        </lion-tabs>
      `);
      expect(parseInt(getComputedStyle(el).height, 10)).to.be.above(100);
    });

    it('automatically switches between vertical/horizontal alignment if the tabs width would exceed the width of the container', async () => {
      const el = await fixture(html`
        <div style="width: 200px;">
          <lion-tabs>
            <button slot="tab">longer tab 1</button>
            <div slot="panel">panel 1</div>
            <button slot="tab">longer tab 2</button>
            <div slot="panel">panel 2</div>
          </lion-tabs>
        </div>
      `);
      const lionTabs = el.querySelector('lion-tabs');
      expect(lionTabs._vertical).to.be.false;

      el.style.width = '100px';
      expect(lionTabs._vertical).to.be.true;
    });

    it('enables "arrow-left behavior" for [arrow-up]', async () => {
      const el = await fixture(html`
        <lion-tabs _vertical>
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
          <button slot="tab">tab 3</button>
          <div slot="panel">panel 3</div>
        </lion-tabs>
      `);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
      expect(el.selectedIndex).to.equal(2);
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
      expect(el.selectedIndex).to.equal(1);
    });

    it('enables "arrow-right" behavior for [arrow-down]', async () => {
      const el = await fixture(html`
        <lion-tabs _vertical>
          <button slot="tab">tab 1</button>
          <div slot="panel">panel 1</div>
          <button slot="tab">tab 2</button>
          <div slot="panel">panel 2</div>
          <button slot="tab">tab 3</button>
          <div slot="panel">panel 3</div>
        </lion-tabs>
      `);
      const tabs = el.querySelectorAll('[slot=tab]');
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      expect(el.selectedIndex).to.equal(1);
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      tabs[0].dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      expect(el.selectedIndex).to.equal(0);
    });
  });

  /**
   * Not in scope:
   * - allow to delete tabs
   *
   * For extending layer with Design system:
   * - add options for alignment (justify, right, left,center) of tabs
   * - add option for large tabs
   */
});
