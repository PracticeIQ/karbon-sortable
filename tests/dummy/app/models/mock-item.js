import DS from "ember-data";

export default DS.Model.extend({
  title: DS.attr('string'),
  isChild: DS.attr('boolean', { defaultValue: false }),
  isParent: DS.attr('boolean', { defaultValue: false }),

  // data attribute
  draggable: true
});
