import Ember from 'ember';

export default Ember.Controller.extend({

  actions: {
    orderChanged: function(item, oldIndex, newIndex, isChild, children) {
      console.log('orderChanged item: ', item.get('title'),
                  ' old: ', oldIndex,
                  ' new: ', newIndex,
                  ' isChild: ', isChild,
                  ' children: ', children,
                  ' isSection: ', item.get('isSection'));
    },

    toggleSection: function(item) {
      const model = this.get('model');
      const isCollapsed = item.get('sectionIsCollapsed');
      const listSize = model.get('length');

      let index = model.indexOf(item) + 1;

      // Nothing to do if we're at the bottom with no children
      if (index === listSize) return;

      let child = model.objectAt(index);

      while (!child.get('isSection') && index < listSize) {
        child.set('isCollapsedSectionChild', !isCollapsed);

        index++;
        if (index < listSize) child = model.objectAt(index);
      }

      item.set('sectionIsCollapsed', !isCollapsed);
    },

    dropOnWell: function(wellId, itemId) {
      console.log('wellId: ', wellId, ' itemId: ', itemId);
    }
  }
});
