import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    orderChanged: function(item, oldIndex, newIndex) {
      console.log('orderChanged item: ', item.get('title'),
                  ' old: ', oldIndex,
                  ' new: ', newIndex);
    }
  }
});
