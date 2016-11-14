import Ember from 'ember';
import layout from '../templates/components/karbon-sortable-item';

export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['spacer'],
  classNameBindings: ['handleClass', 'isSection:section', 'isNested:nested'],
  attributeBindings: ['draggable', 'pkid:data-pkid'],
  handleClass: 'droppable',
  // temporary
  draggable: Ember.computed.not('data.isSection'),
  isSection: Ember.computed.alias('data.isSection'),
  isNested: Ember.computed.alias('data.isChild'),
  pkid: Ember.computed.alias('data.id'),
  layout,

  didInsertElement() {
    // We don't need to pass any data (yet), but FF won't drag unless this is set
    this.$().attr('ondragstart', "event.dataTransfer.setData('text/plain', 'text')");
  },

/*
  click() {
    const data = this.get('data');

    if (data.get('isSection')) {
      this.get('toggleSection')(data);
      return false;
    }
  }
  */
});
