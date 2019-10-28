import { storiesOf, html } from '@open-wc/demoing-storybook';
import '../lion-tabs.js';

storiesOf('Tabs', module)
  .add(
    'Default',
    () => html`
      <lion-tabs>
        <button slot="tab">Info</button>
        <div slot="panel">
          <h2>Info</h2>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laboriosam sequi odit cumque,
          enim aut assumenda itaque quis voluptas est quos fugiat unde labore reiciendis saepe,
          iure, optio officiis obcaecati quibusdam.
        </div>
        <button slot="tab">About</button>
        <div slot="panel">
          <h2>About</h2>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laboriosam sequi odit cumque,
          enim aut assumenda itaque quis voluptas est quos fugiat unde labore reiciendis saepe,
          iure, optio officiis obcaecati quibusdam.
        </div>
      </lion-tabs>
    `,
  )
  .add(
    'selectedIndex',
    () => html`
      <lion-tabs .selectedIndex=${1}>
        <button slot="tab">Info</button>
        <button slot="tab">About</button>
        <div slot="panel">
          <h2>Info</h2>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laboriosam sequi odit cumque,
          enim aut assumenda itaque quis voluptas est quos fugiat unde labore reiciendis saepe,
          iure, optio officiis obcaecati quibusdam.
        </div>
        <div slot="panel">
          <h2>About</h2>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laboriosam sequi odit cumque,
          enim aut assumenda itaque quis voluptas est quos fugiat unde labore reiciendis saepe,
          iure, optio officiis obcaecati quibusdam.
        </div>
      </lion-tabs>
    `,
  )
  .add(
    'Slots order',
    () => html`
      <lion-tabs>
        <button slot="tab">Info</button>
        <button slot="tab">About</button>
        <div slot="panel">
          <h2>Info</h2>
          Info: This is exactly the same just in the code it's differently ordered.
        </div>
        <div slot="panel">
          <h2>About</h2>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Laboriosam sequi odit cumque,
          enim aut assumenda itaque quis voluptas est quos fugiat unde labore reiciendis saepe,
          iure, optio officiis obcaecati quibusdam.
        </div>
      </lion-tabs>
    `,
  );
