import DS from "ember-data";

export default DS.Model.extend({
  title: DS.attr('string'),
  isParent: DS.attr('boolean', { defaultValue: false }),
  isSection: DS.attr('boolean', { defaultValue: false }),
  parentChecklistItem: DS.attr('string'),

  isChild: Ember.computed('parentChecklistItem', function() {
    return !!this.get('parentChecklistItem');
  }),

  // data attributes
  draggable: true,
  inserting: false,
  sectionIsCollapsed: false,
  isCollapsedSectionChild: false
});
