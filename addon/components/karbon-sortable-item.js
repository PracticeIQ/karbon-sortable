import Ember from 'ember';
import layout from '../templates/components/karbon-sortable-item';

export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['spacer'],
  classNameBindings: ['handleClass', 'isSection:section', 'isNested:nested'],
  attributeBindings: ['draggable', 'pkid:data-pkid'],
  handleClass: 'droppable',

  draggable: true,
  isSection: Ember.computed.alias('data.isSection'),
  isNested: Ember.computed.alias('data.isChild'),
  pkid: Ember.computed.alias('data.id'),
  layout,

  didInsertElement() {
    // Dropwells grab the id from here on a drop
    this.$().attr('ondragstart', "event.dataTransfer.setData('text/plain', '" + this.get('pkid') +  "')");
  }
});
