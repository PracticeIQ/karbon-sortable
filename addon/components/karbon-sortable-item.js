import Ember from 'ember';
import layout from '../templates/components/karbon-sortable-item';

export default Ember.Component.extend({
  tagName: 'li',
  classNames: ['spacer'],
  classNameBindings: ['handleClass', 'isSection:section', 'isNested:nested'],
  attributeBindings: ['draggable', 'pkid:data-pkid', 'type:data-type'],
  handleClass: 'droppable',

  draggable: true,
  isSection: Ember.computed.alias('data.isSection'),
  isNested: Ember.computed.alias('data.isChild'),
  pkid: Ember.computed.alias('data.id'),
  layout,

  didInsertElement() {
    // Dropwells grab the id from here on a drop. The data is also passed via the `externalItemDropped` event on a karbon-sortable-list.
    const self = this;
    this.$().on("dragstart", function (e) {
      //If we are dragging a child lists item it will fire first and we want to make sure we dont override it with the parent list item data.
      if(e.originalEvent.dataTransfer.getData("dragData").length) return;

      const data = {pkid: self.get('pkid'), type: self.get('type')};
      var j = JSON.stringify(data);
      e.originalEvent.dataTransfer.setData("dragData", j);
    });

  }
});
