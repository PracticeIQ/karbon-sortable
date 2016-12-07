import Ember from 'ember';

// Simple models
const items = [
    {
      name: 'Section 1',
      isSection: true
    },
    {
      name: 'apple',
      isSection: false
    },
    {
      name: 'pear',
      isSection: false
    },
    {
      name: 'mango',
      isSection: false
    },
    {
      name: 'gnome',
      isSection: false
    },
    {
      name: 'troll',
      isSection: false
    },
    {
      name: 'weasel',
      isSection: false
    },
    {
      name: 'farret',
      isSection: false
    },
    {
      name: 'doorknob',
      isSection: false
    },
    {
      name: 'bamboo',
      isSection: false
    },
    {
      name: 'Empty Section',
      isSection: true
    },
    {
      name: 'Section 2',
      isSection: true
    },
    {
      name: 'lemon',
      isSection: false
    },
    {
      name: 'orange',
      isSection: false
    },
    {
      name: 'dwarf',
      isSection: false
    },
    {
      name: 'sentinel',
      isSection: false
    },
    {
      name: 'candle',
      isSection: false
    },
    {
      name: 'martini',
      isSection: false
    },
    {
      name: 'Section 3',
      isSection: true
    },
    {
      name: 'boxcar',
      isSection: false
    },
    {
      name: 'pegasus',
      isSection: false
    },
    {
      name: 'zirconium',
      isSection: false
    },
    {
      name: 'knoxberry',
      isSection: false
    }
    /*
    'tensor',
    'carbon',
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana'
    */
];

export default Ember.Route.extend({
  model: function() {
    const mockModels = Ember.A();

    items.forEach( (item) => {
      const mockItem = this.store.createRecord('mock-item', {
        id: Math.floor(Math.random() * 100000000) + '',
        title: item.name,
        isSection: item.isSection
      });

      mockModels.push(mockItem);
    });

    return mockModels;
  }
});

