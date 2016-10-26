import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('karbon-sortable-item', 'Integration | Component | karbon sortable item', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{karbon-sortable-item}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#karbon-sortable-item}}
      template block text
    {{/karbon-sortable-item}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
