import Ember from 'ember';
import layout from '../templates/components/expandable-item';

export default Ember.Component.extend({
  classNames: ['expandable-item'],
  classNameBindings: ['expanded'],
  layout,
  expanded: false,
  data: null,

  click: function() {
    if (this.get('data.isSection')) {
      console.log('sending toggleSection');
      this.sendAction('toggleSection', this.get('data'));
    } else {
      this.toggleProperty('expanded');

      const data = this.get('data');
      data.set('draggable', !this.get('expanded'));
      return false;
    }
  }
});


