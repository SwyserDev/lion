import { expect, fixture, html, unsafeStatic, triggerFocusFor, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import { localizeTearDown } from '@lion/localize/test-helpers.js';
import '@lion/input/lion-input.js';
import '../lion-fieldset.js';

const tagString = 'lion-fieldset';
const tag = unsafeStatic(tagString);
const childTagString = 'lion-input';
const childTag = unsafeStatic(childTagString);
const inputSlots = html`
  <${childTag} name="gender[]"></${childTag}>
  <${childTag} name="gender[]"></${childTag}>
  <${childTag} name="color"></${childTag}>
  <${childTag} name="hobbies[]"></${childTag}>
  <${childTag} name="hobbies[]"></${childTag}>
`;

beforeEach(() => {
  localizeTearDown();
});

describe('<lion-fieldset>', () => {
  it(`${tagString} has an up to date list of every form element in #formElements`, async () => {
    const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
    await nextFrame();
    expect(Object.keys(fieldset.formElements).length).to.equal(3);
    expect(fieldset.formElements['hobbies[]'].length).to.equal(2);
    fieldset.removeChild(fieldset.formElements['hobbies[]'][0]);
    expect(Object.keys(fieldset.formElements).length).to.equal(3);
    expect(fieldset.formElements['hobbies[]'].length).to.equal(1);
  });

  it(`supports in html wrapped form elements`, async () => {
    const el = await fixture(html`
      <${tag}>
        <div>
          <${childTag} name="foo"></${childTag}>
        </div>
      </${tag}>
    `);
    await nextFrame();
    expect(el.formElementsArray.length).to.equal(1);
    el.children[0].removeChild(el.formElements.foo);
    expect(el.formElementsArray.length).to.equal(0);
  });

  it('handles names with ending [] as an array', async () => {
    const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
    await nextFrame();
    fieldset.formElements['gender[]'][0].modelValue = { value: 'male' };
    fieldset.formElements['hobbies[]'][0].modelValue = { checked: false, value: 'chess' };
    fieldset.formElements['hobbies[]'][1].modelValue = { checked: false, value: 'rugby' };

    expect(Object.keys(fieldset.formElements).length).to.equal(3);
    expect(fieldset.formElements['hobbies[]'].length).to.equal(2);
    expect(fieldset.formElements['hobbies[]'][0].modelValue.value).to.equal('chess');
    expect(fieldset.formElements['gender[]'][0].modelValue.value).to.equal('male');
    expect(fieldset.modelValue['hobbies[]']).to.deep.equal([
      { checked: false, value: 'chess' },
      { checked: false, value: 'rugby' },
    ]);
  });

  it('throws if an element without a name tries to register', async () => {
    const orig = console.info;
    console.info = () => {};

    let error = false;
    const el = await fixture(html`<${tag}></${tag}>`);
    try {
      // we test the api directly as errors thrown from a web component are in a
      // different context and we can not catch them here => register fake elements
      el.addFormElement({});
    } catch (err) {
      error = err;
    }
    expect(error).to.be.instanceOf(TypeError);
    expect(error.message).to.equal('You need to define a name');

    console.info = orig; // restore original console
  });

  it('throws if name is the same as its parent', async () => {
    const orig = console.info;
    console.info = () => {};

    let error = false;
    const el = await fixture(html`<${tag} name="foo"></${tag}>`);
    try {
      // we test the api directly as errors thrown from a web component are in a
      // different context and we can not catch them here => register fake elements
      el.addFormElement({ name: 'foo' });
    } catch (err) {
      error = err;
    }
    expect(error).to.be.instanceOf(TypeError);
    expect(error.message).to.equal('You can not have the same name "foo" as your parent');

    console.info = orig; // restore original console
  });

  it('throws if same name without ending [] is used', async () => {
    const orig = console.info;
    console.info = () => {};

    let error = false;
    const el = await fixture(html`<${tag}></${tag}>`);
    try {
      // we test the api directly as errors thrown from a web component are in a
      // different context and we can not catch them here => register fake elements
      el.addFormElement({ name: 'fooBar' });
      el.addFormElement({ name: 'fooBar' });
    } catch (err) {
      error = err;
    }
    expect(error).to.be.instanceOf(TypeError);
    expect(error.message).to.equal(
      'Name "fooBar" is already registered - if you want an array add [] to the end',
    );

    console.info = orig; // restore original console
  });
  /* eslint-enable no-console */

  it('can dynamically add/remove elements', async () => {
    const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
    const newField = await fixture(html`<${childTag} name="lastName"></${childTag}>`);

    expect(Object.keys(fieldset.formElements).length).to.equal(3);

    fieldset.appendChild(newField);
    expect(Object.keys(fieldset.formElements).length).to.equal(4);

    fieldset.inputElement.removeChild(newField);
    expect(Object.keys(fieldset.formElements).length).to.equal(3);
  });

  it('can read/write all values (of every input) via this.modelValue', async () => {
    const fieldset = await fixture(html`
      <${tag}>
        <${childTag} name="lastName"></${childTag}>
        <${tag} name="newfieldset">${inputSlots}</${tag}>
      </${tag}>
    `);
    await fieldset.registrationReady;
    const newFieldset = fieldset.querySelector('lion-fieldset');
    await newFieldset.registrationReady;
    fieldset.formElements.lastName.modelValue = 'Bar';
    newFieldset.formElements['hobbies[]'][0].modelValue = { checked: true, value: 'chess' };
    newFieldset.formElements['hobbies[]'][1].modelValue = { checked: false, value: 'football' };
    newFieldset.formElements['gender[]'][0].modelValue = { checked: false, value: 'male' };
    newFieldset.formElements['gender[]'][1].modelValue = { checked: false, value: 'female' };
    newFieldset.formElements.color.modelValue = { checked: false, value: 'blue' };

    expect(fieldset.modelValue).to.deep.equal({
      lastName: 'Bar',
      newfieldset: {
        'hobbies[]': [{ checked: true, value: 'chess' }, { checked: false, value: 'football' }],
        'gender[]': [{ checked: false, value: 'male' }, { checked: false, value: 'female' }],
        color: { checked: false, value: 'blue' },
      },
    });
    fieldset.modelValue = {
      lastName: 2,
      newfieldset: {
        'hobbies[]': [{ checked: true, value: 'chess' }, { checked: false, value: 'baseball' }],
        'gender[]': [{ checked: false, value: 'male' }, { checked: false, value: 'female' }],
        color: { checked: false, value: 'blue' },
      },
    };
    expect(newFieldset.formElements['hobbies[]'][0].modelValue).to.deep.equal({
      checked: true,
      value: 'chess',
    });
    expect(newFieldset.formElements['hobbies[]'][1].modelValue).to.deep.equal({
      checked: false,
      value: 'baseball',
    });
    expect(fieldset.formElements.lastName.modelValue).to.equal(2);
  });

  it('does not throw if setter data of this.modelValue can not be handled', async () => {
    const el = await fixture(html`
      <${tag}>
        <${childTag} name="firstName" .modelValue=${'foo'}></${childTag}>
        <${childTag} name="lastName" .modelValue=${'bar'}></${childTag}>
      </${tag}>
    `);
    await nextFrame();
    const initState = {
      firstName: 'foo',
      lastName: 'bar',
    };
    expect(el.modelValue).to.deep.equal(initState);

    el.modelValue = undefined;
    expect(el.modelValue).to.deep.equal(initState);

    el.modelValue = null;
    expect(el.modelValue).to.deep.equal(initState);
  });

  it('disables/enables all its formElements if it becomes disabled/enabled', async () => {
    const el = await fixture(html`<${tag} disabled>${inputSlots}</${tag}>`);
    await nextFrame();
    expect(el.formElements.color.disabled).to.equal(true);
    expect(el.formElements['hobbies[]'][0].disabled).to.equal(true);
    expect(el.formElements['hobbies[]'][1].disabled).to.equal(true);

    el.disabled = false;
    await el.updateComplete;
    expect(el.formElements.color.disabled).to.equal(false);
    expect(el.formElements['hobbies[]'][0].disabled).to.equal(false);
    expect(el.formElements['hobbies[]'][1].disabled).to.equal(false);
  });

  it('does not propagate/override initial disabled value on nested form elements', async () => {
    const el = await fixture(
      html`<${tag}><${tag} name="sub" disabled>${inputSlots}</${tag}></${tag}>`,
    );
    await el.updateComplete;
    expect(el.disabled).to.equal(false);
    expect(el.formElements.sub.disabled).to.equal(true);
    expect(el.formElements.sub.formElements.color.disabled).to.equal(true);
    expect(el.formElements.sub.formElements['hobbies[]'][0].disabled).to.equal(true);
    expect(el.formElements.sub.formElements['hobbies[]'][1].disabled).to.equal(true);
  });

  // classes are added only for backward compatibility - they are deprecated
  it('sets a state-disabled class when disabled', async () => {
    const el = await fixture(html`<${tag} disabled>${inputSlots}</${tag}>`);
    await nextFrame();
    expect(el.classList.contains('state-disabled')).to.equal(true);
    el.disabled = false;
    await nextFrame();
    expect(el.classList.contains('state-disabled')).to.equal(false);
  });

  describe('validation', () => {
    it('validates on init', async () => {
      function isCat(value) {
        return { isCat: value === 'cat' };
      }
      const el = await fixture(html`
        <${tag}>
          <${childTag} name="color"
            .errorValidators=${[[isCat]]}
            .modelValue=${'blue'}
          ></${childTag}>
        </${tag}>
      `);
      await nextFrame();
      expect(el.formElements.color.error.isCat).to.equal(true);
    });

    it('validates when a value changes', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await nextFrame();
      const spy = sinon.spy(fieldset, 'validate');
      fieldset.formElements.color.modelValue = { checked: true, value: 'red' };
      expect(spy.callCount).to.equal(1);
    });

    it('has a special {error, warning, info, success} validator for all children - can be checked via this.error.formElementsHaveNoError', async () => {
      function isCat(value) {
        return { isCat: value === 'cat' };
      }

      const el = await fixture(html`
        <${tag}>
          <${childTag} name="color"
            .errorValidators=${[[isCat]]}
            .modelValue=${'blue'}
          ></${childTag}>
        </${tag}>
      `);
      await nextFrame();

      expect(el.error.formElementsHaveNoError).to.equal(true);
      expect(el.formElements.color.error.isCat).to.equal(true);
      el.formElements.color.modelValue = 'cat';
      expect(el.error).to.deep.equal({});
    });

    it('validates on children (de)registration', async () => {
      function hasEvenNumberOfChildren(modelValue) {
        return { even: Object.keys(modelValue).length % 2 === 0 };
      }
      const el = await fixture(html`
        <${tag} .errorValidators=${[[hasEvenNumberOfChildren]]}>
          <${childTag} id="c1" name="c1"></${childTag}>
        </${tag}>
      `);
      const child2 = await fixture(
        html`
          <${childTag} name="c2"></${childTag}>
        `,
      );

      await nextFrame();
      expect(el.error.even).to.equal(true);

      el.appendChild(child2);
      await nextFrame();
      expect(el.error.even).to.equal(undefined);

      el.removeChild(child2);
      await nextFrame();
      expect(el.error.even).to.equal(true);

      // Edge case: remove all children
      el.removeChild(el.querySelector('[id=c1]'));
      await nextFrame();
      expect(el.error.even).to.equal(undefined);
    });
  });

  describe('interaction states', () => {
    it('has false states (dirty, touched, prefilled) on init', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await nextFrame();
      expect(fieldset.dirty).to.equal(false, 'dirty');
      expect(fieldset.touched).to.equal(false, 'touched');
      expect(fieldset.prefilled).to.equal(false, 'prefilled');
    });

    it('sets dirty when value changed', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await nextFrame();
      fieldset.formElements['hobbies[]'][0].modelValue = { checked: true, value: 'football' };
      expect(fieldset.dirty).to.equal(true);
    });

    it('sets touched when last field in fieldset left after focus', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await triggerFocusFor(fieldset.formElements['hobbies[]'][0].inputElement);
      await triggerFocusFor(
        fieldset.formElements['hobbies[]'][fieldset.formElements['gender[]'].length - 1]
          .inputElement,
      );
      const el = await fixture(html`
        <button></button>
      `);
      el.focus();

      expect(fieldset.touched).to.be.true;
    });

    it('sets attributes [touched][dirty]', async () => {
      const el = await fixture(html`<${tag}></${tag}>`);
      el.touched = true;
      await el.updateComplete;
      expect(el).to.have.attribute('touched');

      el.dirty = true;
      await el.updateComplete;
      expect(el).to.have.attribute('dirty');
    });

    it('[deprecated] sets a class "state-(touched|dirty)"', async () => {
      const el = await fixture(html`<${tag}></${tag}>`);
      el.touched = true;
      await el.updateComplete;
      expect(el.classList.contains('state-touched')).to.equal(true, 'has class "state-touched"');

      el.dirty = true;
      await el.updateComplete;
      expect(el.classList.contains('state-dirty')).to.equal(true, 'has class "state-dirty"');
    });

    it('becomes prefilled if all form elements are prefilled', async () => {
      const el = await fixture(html`
        <${tag}>
          <${childTag} name="input1" prefilled></${childTag}>
          <${childTag} name="input2"></${childTag}>
        </${tag}>
      `);
      await nextFrame();
      expect(el.prefilled).to.be.false;

      const el2 = await fixture(html`
        <${tag}>
          <${childTag} name="input1" prefilled></${childTag}>
          <${childTag} name="input2" prefilled></${childTag}>
        </${tag}>
      `);
      await nextFrame();
      expect(el2.prefilled).to.be.true;
    });

    it(`becomes "touched" once the last element of a group becomes blurred by keyboard
      interaction (e.g. tabbing through the checkbox-group)`, async () => {
      const el = await fixture(html`
        <${tag}>
          <label slot="label">My group</label>
          <${childTag} name="myGroup[]" label="Option 1" value="1"></${childTag}>
          <${childTag} name="myGroup[]" label="Option 2" value="2"></${childTag}>
        </${tag}>
      `);
      await nextFrame();

      const button = await fixture(`<button>Blur</button>`);

      expect(el.touched).to.equal(false, 'initially, touched state is false');
      el.children[2].focus();
      expect(el.touched).to.equal(false, 'focus is on second checkbox');
      button.focus();
      expect(el.touched).to.equal(
        true,
        `focus is on element behind second checkbox (group has blurred)`,
      );
    });

    it(`becomes "touched" once the group as a whole becomes blurred via mouse interaction after
      keyboard interaction (e.g. focus is moved inside the group and user clicks somewhere outside
      the group)`, async () => {
      const el = await fixture(html`
        <${tag}>
          <${childTag} name="input1"></${childTag}>
          <${childTag} name="input2"></${childTag}>
        </${tag}>
      `);
      const el2 = await fixture(html`
        <${tag}>
          <${childTag} name="input1"></${childTag}>
          <${childTag} name="input2"></${childTag}>
        </${tag}>
      `);

      await nextFrame();
      const outside = await fixture(html`
        <button>outside</button>
      `);

      outside.click();
      expect(el.touched, 'unfocused fieldset should stays untouched').to.be.false;

      el.children[1].focus();
      el.children[2].focus();
      expect(el.touched).to.be.false;

      outside.click(); // blur the group via a click
      outside.focus(); // a real mouse click moves focus as well
      expect(el.touched).to.be.true;

      expect(el2.touched).to.be.false;
    });

    it('potentially shows fieldset error message on interaction change', async () => {
      const input1IsTen = value => ({ input1IsTen: value.input1 === 10 });
      const isNumber = value => ({ isNumber: typeof value === 'number' });
      const outSideButton = await fixture(html`
        <button>outside</button>
      `);
      const el = await fixture(html`
        <${tag} .errorValidators=${[[input1IsTen]]}>
          <${childTag} name="input1" .errorValidators=${[[isNumber]]}></${childTag}>
        </${tag}>
      `);
      await nextFrame();
      const input1 = el.querySelector(childTagString);
      input1.modelValue = 2;
      input1.focus();
      outSideButton.focus();

      await el.updateComplete;
      expect(el.error.input1IsTen).to.be.true;
      expect(el.errorShow).to.be.true;
    });

    it('show error if tabbing "out" of last ', async () => {
      const input1IsTen = value => ({ input1IsTen: value.input1 === 10 });
      const isNumber = value => ({ isNumber: typeof value === 'number' });
      const outSideButton = await fixture(html`
        <button>outside</button>
      `);
      const el = await fixture(html`
        <${tag} .errorValidators=${[[input1IsTen]]}>
          <${childTag} name="input1" .errorValidators=${[[isNumber]]}></${childTag}>
          <${childTag} name="input2" .errorValidators=${[[isNumber]]}></${childTag}>
        </${tag}>
      `);
      const inputs = el.querySelectorAll(childTagString);
      inputs[1].modelValue = 2; // make it dirty
      inputs[1].focus();

      outSideButton.focus();
      await nextFrame();

      expect(el.error.input1IsTen).to.be.true;
      expect(el.errorShow).to.be.true;
    });
  });

  describe('serialize', () => {
    it('use form elements serializedValue', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await nextFrame();
      fieldset.formElements['hobbies[]'][0].serializer = v => `${v.value}-serialized`;
      fieldset.formElements['hobbies[]'][0].modelValue = { checked: false, value: 'Bar' };
      fieldset.formElements['hobbies[]'][1].modelValue = { checked: false, value: 'rugby' };
      fieldset.formElements['gender[]'][0].modelValue = { checked: false, value: 'male' };
      fieldset.formElements['gender[]'][1].modelValue = { checked: false, value: 'female' };
      fieldset.formElements.color.modelValue = { checked: false, value: 'blue' };
      expect(fieldset.formElements['hobbies[]'][0].serializedValue).to.equal('Bar-serialized');
      expect(fieldset.serializeGroup()).to.deep.equal({
        'hobbies[]': ['Bar-serialized', { checked: false, value: 'rugby' }],
        'gender[]': [{ checked: false, value: 'male' }, { checked: false, value: 'female' }],
        color: { checked: false, value: 'blue' },
      });
    });

    it('form elements which are not disabled', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await nextFrame();
      fieldset.formElements.color.modelValue = { checked: false, value: 'blue' };
      fieldset.formElements['hobbies[]'][0].modelValue = { checked: true, value: 'football' };
      fieldset.formElements['gender[]'][0].modelValue = { checked: true, value: 'male' };
      fieldset.formElements['hobbies[]'][1].modelValue = { checked: false, value: 'rugby' };
      fieldset.formElements['gender[]'][1].modelValue = { checked: false, value: 'female' };
      fieldset.formElements.color.modelValue = { checked: false, value: 'blue' };

      expect(fieldset.serializeGroup()).to.deep.equal({
        'hobbies[]': [{ checked: true, value: 'football' }, { checked: false, value: 'rugby' }],
        'gender[]': [{ checked: true, value: 'male' }, { checked: false, value: 'female' }],
        color: { checked: false, value: 'blue' },
      });
      fieldset.formElements.color.disabled = true;

      expect(fieldset.serializeGroup()).to.deep.equal({
        'hobbies[]': [{ checked: true, value: 'football' }, { checked: false, value: 'rugby' }],
        'gender[]': [{ checked: true, value: 'male' }, { checked: false, value: 'female' }],
      });
    });

    it('allows for nested fieldsets', async () => {
      const fieldset = await fixture(html`
        <${tag} name="userData">
          <${childTag} name="comment"></${childTag}>
          <${tag} name="newfieldset">${inputSlots}</${tag}>
        </${tag}>
      `);
      await nextFrame();
      const newFieldset = fieldset.querySelector('lion-fieldset');
      newFieldset.formElements['hobbies[]'][0].modelValue = { checked: false, value: 'chess' };
      newFieldset.formElements['hobbies[]'][1].modelValue = { checked: false, value: 'rugby' };
      newFieldset.formElements['gender[]'][0].modelValue = { checked: false, value: 'male' };
      newFieldset.formElements['gender[]'][1].modelValue = { checked: false, value: 'female' };
      newFieldset.formElements.color.modelValue = { checked: false, value: 'blue' };
      fieldset.formElements.comment.modelValue = 'Foo';
      expect(Object.keys(fieldset.formElements).length).to.equal(2);
      expect(Object.keys(newFieldset.formElements).length).to.equal(3);
      expect(fieldset.serializeGroup()).to.deep.equal({
        comment: 'Foo',
        newfieldset: {
          'hobbies[]': [{ checked: false, value: 'chess' }, { checked: false, value: 'rugby' }],
          'gender[]': [{ checked: false, value: 'male' }, { checked: false, value: 'female' }],
          color: { checked: false, value: 'blue' },
        },
      });
    });

    it('will exclude form elements within an disabled fieldset', async () => {
      const fieldset = await fixture(html`
        <${tag} name="userData">
          <${childTag} name="comment"></${childTag}>
          <${tag} name="newfieldset">${inputSlots}</${tag}>
        </${tag}>
      `);
      await nextFrame();

      const newFieldset = fieldset.querySelector('lion-fieldset');
      fieldset.formElements.comment.modelValue = 'Foo';
      newFieldset.formElements['hobbies[]'][0].modelValue = { checked: false, value: 'chess' };
      newFieldset.formElements['hobbies[]'][1].modelValue = { checked: false, value: 'rugby' };
      newFieldset.formElements['gender[]'][0].modelValue = { checked: false, value: 'male' };
      newFieldset.formElements['gender[]'][1].modelValue = { checked: false, value: 'female' };
      newFieldset.formElements.color.modelValue = { checked: false, value: 'blue' };
      newFieldset.formElements.color.disabled = true;

      expect(fieldset.serializeGroup()).to.deep.equal({
        comment: 'Foo',
        newfieldset: {
          'hobbies[]': [{ checked: false, value: 'chess' }, { checked: false, value: 'rugby' }],
          'gender[]': [{ checked: false, value: 'male' }, { checked: false, value: 'female' }],
        },
      });

      newFieldset.formElements.color.disabled = false;
      expect(fieldset.serializeGroup()).to.deep.equal({
        comment: 'Foo',
        newfieldset: {
          'hobbies[]': [{ checked: false, value: 'chess' }, { checked: false, value: 'rugby' }],
          'gender[]': [{ checked: false, value: 'male' }, { checked: false, value: 'female' }],
          color: { checked: false, value: 'blue' },
        },
      });
    });

    it('treats names with ending [] as arrays', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await nextFrame();
      fieldset.formElements['hobbies[]'][0].modelValue = { checked: false, value: 'chess' };
      fieldset.formElements['hobbies[]'][1].modelValue = { checked: false, value: 'rugby' };
      fieldset.formElements['gender[]'][0].modelValue = { checked: false, value: 'male' };
      fieldset.formElements['gender[]'][1].modelValue = { checked: false, value: 'female' };
      fieldset.formElements.color.modelValue = { checked: false, value: 'blue' };
      expect(fieldset.serializeGroup()).to.deep.equal({
        'hobbies[]': [{ checked: false, value: 'chess' }, { checked: false, value: 'rugby' }],
        'gender[]': [{ checked: false, value: 'male' }, { checked: false, value: 'female' }],
        color: { checked: false, value: 'blue' },
      });
    });

    it('does not serialize undefined values (nb radios/checkboxes are always serialized)', async () => {
      const fieldset = await fixture(html`
        <${tag}>
          <${childTag} name="custom[]"></${childTag}>
          <${childTag} name="custom[]"></${childTag}>
        </${tag}>
      `);
      await nextFrame();
      fieldset.formElements['custom[]'][0].modelValue = 'custom 1';
      fieldset.formElements['custom[]'][1].modelValue = undefined;

      expect(fieldset.serializeGroup()).to.deep.equal({
        'custom[]': ['custom 1'],
      });
    });
  });

  describe('reset', () => {
    it('restores default values if changes were made', async () => {
      const el = await fixture(html`
        <${tag}>
          <${childTag} id="firstName" name="firstName" .modelValue="${'Foo'}"></${childTag}>
        </${tag}>
      `);
      await el.querySelector('lion-input').updateComplete;

      const input = el.querySelector('#firstName');

      input.modelValue = 'Bar';
      expect(el.modelValue).to.deep.equal({ firstName: 'Bar' });
      expect(input.modelValue).to.equal('Bar');

      el.resetGroup();
      expect(el.modelValue).to.deep.equal({ firstName: 'Foo' });
      expect(input.modelValue).to.equal('Foo');
    });

    it('restores default values of arrays if changes were made', async () => {
      const el = await fixture(html`
        <${tag}>
          <${childTag} id="firstName" name="firstName[]" .modelValue="${'Foo'}"></${childTag}>
        </${tag}>
      `);
      await el.querySelector('lion-input').updateComplete;

      const input = el.querySelector('#firstName');

      input.modelValue = 'Bar';
      expect(el.modelValue).to.deep.equal({ 'firstName[]': ['Bar'] });
      expect(input.modelValue).to.equal('Bar');

      el.resetGroup();
      expect(el.modelValue).to.deep.equal({ 'firstName[]': ['Foo'] });
      expect(input.modelValue).to.equal('Foo');
    });

    it('restores default values of a nested fieldset if changes were made', async () => {
      const el = await fixture(html`
        <${tag}>
          <${tag} id="name" name="name[]">
            <${childTag} id="firstName" name="firstName" .modelValue="${'Foo'}"></${childTag}>
          </${tag}>
        </${tag}>
      `);
      await Promise.all([
        el.querySelector('lion-fieldset').updateComplete,
        el.querySelector('lion-input').updateComplete,
      ]);

      const input = el.querySelector('#firstName');
      const nestedFieldset = el.querySelector('#name');

      input.modelValue = 'Bar';
      expect(el.modelValue).to.deep.equal({ 'name[]': [{ firstName: 'Bar' }] });
      expect(nestedFieldset.modelValue).to.deep.equal({ firstName: 'Bar' });
      expect(input.modelValue).to.equal('Bar');

      el.resetGroup();
      expect(el.modelValue).to.deep.equal({ 'name[]': [{ firstName: 'Foo' }] });
      expect(nestedFieldset.modelValue).to.deep.equal({ firstName: 'Foo' });
      expect(input.modelValue).to.equal('Foo');
    });

    it('clears interaction state', async () => {
      const el = await fixture(html`<${tag} touched dirty>${inputSlots}</${tag}>`);
      await nextFrame();
      // Safety check initially
      el._setValueForAllFormElements('prefilled', true);
      expect(el.dirty).to.equal(true, '"dirty" initially');
      expect(el.touched).to.equal(true, '"touched" initially');
      expect(el.prefilled).to.equal(true, '"prefilled" initially');

      // Reset all children states, with prefilled false
      el._setValueForAllFormElements('modelValue', {});
      el.resetInteractionState();
      expect(el.dirty).to.equal(false, 'not "dirty" after reset');
      expect(el.touched).to.equal(false, 'not "touched" after reset');
      expect(el.prefilled).to.equal(false, 'not "prefilled" after reset');

      // Reset all children states with prefilled true
      el._setValueForAllFormElements('modelValue', { checked: true }); // not prefilled
      el.resetInteractionState();
      expect(el.dirty).to.equal(false, 'not "dirty" after 2nd reset');
      expect(el.touched).to.equal(false, 'not "touched" after 2nd reset');
      // prefilled state is dependant on value
      expect(el.prefilled).to.equal(true, '"prefilled" after 2nd reset');
    });

    it('clears submitted state', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await nextFrame();
      fieldset.submitted = true;
      fieldset.resetGroup();
      expect(fieldset.submitted).to.equal(false);
      fieldset.formElementsArray.forEach(el => {
        expect(el.submitted).to.equal(false);
      });
    });

    it('has correct validation afterwards', async () => {
      const isCat = modelValue => ({ isCat: modelValue === 'cat' });
      const containsA = modelValues => ({
        containsA: modelValues.color ? modelValues.color.indexOf('a') > -1 : false,
      });

      const el = await fixture(html`
        <${tag} .errorValidators=${[[containsA]]}>
          <${childTag} name="color" .errorValidators=${[[isCat]]}></${childTag}>
          <${childTag} name="color2"></${childTag}>
        </${tag}>
      `);
      await el.registrationReady;
      expect(el.errorState).to.be.true;
      expect(el.error.containsA).to.be.true;
      expect(el.formElements.color.errorState).to.be.false;

      el.formElements.color.modelValue = 'onlyb';
      expect(el.errorState).to.be.true;
      expect(el.error.containsA).to.be.true;
      expect(el.formElements.color.error.isCat).to.be.true;

      el.formElements.color.modelValue = 'cat';
      expect(el.errorState).to.be.false;

      el.resetGroup();
      expect(el.errorState).to.be.true;
      expect(el.error.containsA).to.be.true;
      expect(el.formElements.color.errorState).to.be.false;
    });

    it('has access to `_initialModelValue` based on initial children states', async () => {
      const el = await fixture(html`
        <${tag}>
          <${childTag} name="child[]" .modelValue="${'foo1'}">
          </${childTag}>
          <${childTag} name="child[]" .modelValue="${'bar1'}">
          </${childTag}>
        </${tag}>
      `);
      await el.updateComplete;
      el.modelValue['child[]'] = ['foo2', 'bar2'];
      expect(el._initialModelValue['child[]']).to.eql(['foo1', 'bar1']);
    });

    it('does not wrongly recompute `_initialModelValue` after dynamic changes of children', async () => {
      const el = await fixture(html`
        <${tag}>
          <${childTag} name="child[]" .modelValue="${'foo1'}">
          </${childTag}>
        </${tag}>
      `);
      el.modelValue['child[]'] = ['foo2'];
      const childEl = await fixture(html`
        <${childTag} name="child[]" .modelValue="${'bar1'}">
        </${childTag}>
      `);
      el.appendChild(childEl);
      expect(el._initialModelValue['child[]']).to.eql(['foo1', 'bar1']);
    });

    describe('resetGroup method', () => {
      it('calls resetGroup on children fieldsets', async () => {
        const el = await fixture(html`
          <${tag} name="parentFieldset">
          <${tag} name="childFieldset">
              <${childTag} name="child[]" .modelValue="${'foo1'}">
              </${childTag}>
            </${tag}>
          </${tag}>
        `);
        const childFieldsetEl = el.querySelector(tagString);
        const resetGroupSpy = sinon.spy(childFieldsetEl, 'resetGroup');
        el.resetGroup();
        expect(resetGroupSpy.callCount).to.equal(1);
      });

      it('calls reset on children fields', async () => {
        const el = await fixture(html`
          <${tag} name="parentFieldset">
          <${tag} name="childFieldset">
              <${childTag} name="child[]" .modelValue="${'foo1'}">
              </${childTag}>
            </${tag}>
          </${tag}>
        `);
        const childFieldsetEl = el.querySelector(childTagString);
        const resetSpy = sinon.spy(childFieldsetEl, 'reset');
        el.resetGroup();
        expect(resetSpy.callCount).to.equal(1);
      });
    });
  });

  describe('a11y', () => {
    // beforeEach(() => {
    //   localizeTearDown();
    // });

    it('has role="group" set', async () => {
      const fieldset = await fixture(html`<${tag}>${inputSlots}</${tag}>`);
      await nextFrame();
      fieldset.formElements['hobbies[]'][0].modelValue = { checked: false, value: 'chess' };
      fieldset.formElements['hobbies[]'][1].modelValue = { checked: false, value: 'rugby' };
      fieldset.formElements['gender[]'][0].modelValue = { checked: false, value: 'male' };
      fieldset.formElements['gender[]'][1].modelValue = { checked: false, value: 'female' };
      fieldset.formElements.color.modelValue = { checked: false, value: 'blue' };
      expect(fieldset.hasAttribute('role')).to.equal(true);
      expect(fieldset.getAttribute('role')).to.contain('group');
    });

    it('has an aria-labelledby from element with slot="label"', async () => {
      const el = await fixture(html`
        <${tag}>
          <label slot="label">My Label</label>
          ${inputSlots}
        </${tag}>
      `);
      const label = el.querySelector('[slot="label"]');
      expect(el.hasAttribute('aria-labelledby')).to.equal(true);
      expect(el.getAttribute('aria-labelledby')).contains(label.id);
    });

    describe('Screen reader relations (aria-describedby) for child fields and fieldsets', () => {
      let childAriaFixture; // function
      let childAriaTest; // function

      before(() => {
        // Legend:
        // - l1 means level 1 (outer) fieldset
        // - l2 means level 2 (inner) fieldset
        // - g means group: the help-text or feedback belongs to group
        // - f means field(lion-input in fixture below): the help-text or feedback belongs to field
        // - 'a' or 'b' behind 'f' indicate which field in a fieldset is meant (a: first, b: second)

        childAriaFixture = async (
          msgSlotType = 'feedback', // eslint-disable-line no-shadow
        ) => {
          const dom = await fixture(html`
            <${tag} name="l1_g">
              <${childTag} name="l1_fa">
                <div slot="${msgSlotType}" id="msg_l1_fa"></div>
                <!-- field referred by: #msg_l1_fa (local), #msg_l1_g (parent/group) -->
              </${childTag}>

              <${childTag} name="l1_fb">
                <div slot="${msgSlotType}" id="msg_l1_fb"></div>
                <!-- field referred by: #msg_l1_fb (local), #msg_l1_g (parent/group) -->
              </${childTag}>

              <!-- [ INNER FIELDSET ] -->

              <${tag} name="l2_g">
                <${childTag} name="l2_fa">
                  <div slot="${msgSlotType}" id="msg_l2_fa"></div>
                  <!-- field referred by: #msg_l2_fa (local), #msg_l2_g (parent/group), #msg_l1_g (grandparent/group.group) -->
                </${childTag}>

                <${childTag} name="l2_fb">
                  <div slot="${msgSlotType}" id="msg_l2_fb"></div>
                  <!-- field referred by: #msg_l2_fb (local), #msg_l2_g (parent/group), #msg_l1_g (grandparent/group.group) -->
                </${childTag}>

                <div slot="${msgSlotType}" id="msg_l2_g"></div>
                <!-- group referred by: #msg_l2_g (local), #msg_l1_g (parent/group)  -->
              </${tag}>

              <!-- [ / INNER FIELDSET ] -->

              <div slot="${msgSlotType}" id="msg_l1_g"></div>
              <!-- group referred by: #msg_l1_g (local) -->
            </${tag}>
          `);
          return dom;
        };

        // eslint-disable-next-line no-shadow
        childAriaTest = childAriaFixture => {
          /* eslint-disable camelcase */
          // Message elements: all elements pointed at by inputs
          const msg_l1_g = childAriaFixture.querySelector('#msg_l1_g');
          const msg_l1_fa = childAriaFixture.querySelector('#msg_l1_fa');
          const msg_l1_fb = childAriaFixture.querySelector('#msg_l1_fb');
          const msg_l2_g = childAriaFixture.querySelector('#msg_l2_g');
          const msg_l2_fa = childAriaFixture.querySelector('#msg_l2_fa');
          const msg_l2_fb = childAriaFixture.querySelector('#msg_l2_fb');

          // Field elements: all inputs pointing to message elements
          const input_l1_fa = childAriaFixture.querySelector('input[name=l1_fa]');
          const input_l1_fb = childAriaFixture.querySelector('input[name=l1_fb]');
          const input_l2_fa = childAriaFixture.querySelector('input[name=l2_fa]');
          const input_l2_fb = childAriaFixture.querySelector('input[name=l2_fb]');

          /* eslint-enable camelcase */

          const ariaDescribedBy = el => el.getAttribute('aria-describedby');

          // 'L1' fields (inside lion-fieldset[name="l1_g"]) should point to l1(group) msg
          expect(ariaDescribedBy(input_l1_fa)).to.contain(
            msg_l1_g.id,
            'l1 input(a) refers parent/group',
          );
          expect(ariaDescribedBy(input_l1_fb)).to.contain(
            msg_l1_g.id,
            'l1 input(b) refers parent/group',
          );

          // Also check that aria-describedby of the inputs are not overridden (this relation was
          // put there in lion-input(using lion-field)).
          expect(ariaDescribedBy(input_l1_fa)).to.contain(
            msg_l1_fa.id,
            'l1 input(a) refers local field',
          );
          expect(ariaDescribedBy(input_l1_fb)).to.contain(
            msg_l1_fb.id,
            'l1 input(b) refers local field',
          );

          // Also make feedback element point to nested fieldset inputs
          expect(ariaDescribedBy(input_l2_fa)).to.contain(
            msg_l1_g.id,
            'l2 input(a) refers grandparent/group.group',
          );
          expect(ariaDescribedBy(input_l2_fb)).to.contain(
            msg_l1_g.id,
            'l2 input(b) refers grandparent/group.group',
          );

          // Check order: the nearest ('dom wise': so 1. local, 2. parent, 3. grandparent) message
          // should be read first by screen reader
          let d = ariaDescribedBy(input_l2_fa);
          expect(
            d.indexOf(msg_l1_g.id) < d.indexOf(msg_l2_g.id) < d.indexOf(msg_l2_fa.id),
          ).to.equal(true, 'order of ids');
          d = ariaDescribedBy(input_l2_fb);
          expect(
            d.indexOf(msg_l1_g.id) < d.indexOf(msg_l2_g.id) < d.indexOf(msg_l2_fb.id),
          ).to.equal(true, 'order of ids');
        };
      });

      it(`reads feedback message belonging to fieldset when child input is focused
        (via aria-describedby)`, async () => {
        childAriaTest(await childAriaFixture('feedback'));
      });

      it(`reads help-text message belonging to fieldset when child input is focused
        (via aria-describedby)`, async () => {
        childAriaTest(await childAriaFixture('help-text'));
      });
    });
  });
});
