import Ember from 'ember';

// Simple models
const items = [
    'apple',
    'pear',
    'mango',
    'lemon',
    'orange',
    'dwarf',
    'gnome',
    'troll',
    'weasel',
    'farret',
    'doorknob',
    'bamboo',
    'sentinel',
    'candle',
    'martini',
    'boxcar',
    'pegasus',
    'zirconium',
    'knoxberry',
    'tensor',
    'carbon'
];

export default Ember.Route.extend({
  model: function() {
    const mockModels = Ember.A();

    items.forEach( (item) => {
      const mockItem = this.store.createRecord('mock-item', {
        title: item
      });

      mockModels.push(mockItem);
    });

    return mockModels;
  }
});

