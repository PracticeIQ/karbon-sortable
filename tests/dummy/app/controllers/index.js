import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    orderChanged: function(item, oldIndex, newIndex, isChild, children) {
      console.log('orderChanged item: ', item.get('title'),
                  ' old: ', oldIndex,
                  ' new: ', newIndex,
                  ' isChild: ', isChild,
                  ' children: ', children);

//      this.get('model').forEach( (item, index) => {
//        console.log(`${index}: ${item.get('title')}`);
//      });
    }
  }
});
