import Ember from 'ember';
import layout from '../templates/components/karbon-sortable-item';

export default Ember.Component.extend({
  tagName: 'li',
  classNameBindings: ['handleClass'],
  attributeBindings: ['draggable'],
  handleClass: 'droppable',
  draggable: 'true',
  layout,

  didInsertElement() {
    // We don't need to pass any data (yet), but FF won't drag unless this is set
    this.$().attr('ondragstart', "event.dataTransfer.setData('text/plain', 'text')");
  }
});
